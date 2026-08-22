"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
import { jobs, companies } from "@/features/job-sync/db/schema";
import featuresConfig from "@/features.config";
import type { GeoSuggestResult, Location } from "@/lib/api/types";

const JOB_POSTINGS_PATH = "/job-postings";

/**
 * How long a self-service posting stays visible before it needs
 * re-posting. Synced (source="cleanjobdata") jobs get their expiresAt from
 * job-sync.config.ts's staleAfterDays, tied to CleanJobData's own sync
 * cadence - that concept doesn't apply to a posted job (there's no
 * upstream sync to go stale relative to), so we pick a flat, generous
 * window instead. 90 days is long enough that no legitimate posting
 * expires while still relevant, short enough that a forgotten posting
 * doesn't linger in search results forever. `jobs.expiresAt` stays
 * NOT NULL (see that column's doc comment) - this is the "sensible default
 * at insert time" option the phase 2 spec called out, chosen over making
 * the column nullable because every other consumer of expiresAt
 * (listJobsFromCache's `gte(expiresAt, now())` filter, lib/expire.ts's
 * backstop sweep) already assumes a real, comparable date and a NULL would
 * need special-casing in both places for one source's rows.
 */
const POSTED_JOB_TTL_DAYS = 90;

async function requireUserId(): Promise<string> {
  const access = await checkAccess("jobPosting");
  if (access.status !== "ok") {
    throw new Error("Job posting is disabled or you must sign in to use it.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must sign in to post a job.");
  }
  return userId;
}

/** True if `companyId` is one of the current user's own "posted" companies. */
async function ownsCompany(userId: string, companyId: string): Promise<boolean> {
  const db = requireDb();
  const [row] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.ownerId, userId)))
    .limit(1);
  return !!row;
}

/** Converts GeoSuggest's selection shape into the `locations` JSONB shape synced jobs already use, so posted jobs are structurally identical for filtering (locationContains() in job-sync/lib/read.ts). */
function toLocations(selected: GeoSuggestResult[]): Location[] {
  return selected.map((loc, i) => ({
    kind: loc.kind,
    is_primary: i === 0,
    city_id: loc.kind === "city" ? loc.city_id : null,
    city_name: loc.kind === "city" ? loc.name : null,
    state_id: loc.kind === "state" ? loc.state_id : null,
    state_name: loc.kind === "state" ? loc.name : null,
    state_code: null,
    country_id: loc.kind === "country" ? loc.country_id : null,
    country_name: loc.kind === "country" ? loc.name : null,
    country_code: null,
    lat: null,
    lng: null,
    timezone: null,
  }));
}

export type CreateJobPostingInput = {
  title: string;
  description: string;
  companyId: string;
  locations: GeoSuggestResult[];
  employmentType?: string | null;
  hasRemote: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryText?: string | null;
  applicationUrl: string;
};

/**
 * Inserts a locally-posted job. Every `jobs` column gets an explicit,
 * documented decision here (per the phase 2 spec) rather than relying on
 * defaults silently doing the right thing:
 *
 * - source: "posted", externalId: null - this job has no CleanJobData identity.
 * - status/requiresVerification: driven by features.config.ts's
 *   jobPosting.requireVerification (default true) - EXPLICITLY branched here
 *   (not just relying on the jobs table's own column defaults) so the
 *   decision is visible at the one place a posting is actually created.
 *   requireVerification=true (default): status="pending", invisible
 *   everywhere - including its own direct /jobs/[id] link, see
 *   getPostedJobById()'s doc comment - until phase 3's admin dashboard
 *   flips it to "approved". requireVerification=false: status="approved"
 *   immediately, for deployments that don't want a moderation step at all.
 *   This feature itself never flips status after insert either way -
 *   update/delete below never touch it.
 * - companyName: denormalized from the resolved company row, same as
 *   sync.ts does for cleanjobdata jobs - keeps JobCard/list rendering from
 *   needing a join just to show the company name.
 * - locationText: a human-readable join of the selected locations' labels,
 *   mirroring what a synced job's locationText looks like (job-sync never
 *   documents its exact derivation here, but JobCard/JobFilters only ever
 *   read it as a display string).
 * - locations: see toLocations() above.
 * - published: now() - a posted job's "published" date IS its creation
 *   date, there's no separate upstream publish time to mirror.
 * - syncedAt: left at its defaultNow() - not meaningful for a posted job
 *   (there's no sync to timestamp), but harmless; nothing reads it for
 *   source="posted" rows.
 * - expiresAt: now() + POSTED_JOB_TTL_DAYS (see that constant's comment).
 * - sourceExpiredAt: left null - only ever set by job-sync's expired-poll,
 *   which only ever looks at source="cleanjobdata" rows.
 * - isActive: left at its default `true` - there's no isActive-flipping
 *   poll for posted jobs (that's a job-sync-specific mechanism, checking
 *   the CleanJobData /jobs/expired endpoint), so it just stays true until
 *   the poster deletes the posting or expiresAt's backstop passes.
 * - experienceLevel / experienceLevels / language: no form field for these
 *   in v1 (spec's field list omits them) - left null / empty array.
 */
export async function createJobPosting(input: CreateJobPostingInput) {
  const userId = await requireUserId();
  const db = requireDb();

  if (!(await ownsCompany(userId, input.companyId))) {
    throw new Error("You can only post jobs under a company you own.");
  }

  const [company] = await db.select().from(companies).where(eq(companies.id, input.companyId)).limit(1);
  if (!company) throw new Error("Company not found.");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + POSTED_JOB_TTL_DAYS * 24 * 60 * 60 * 1000);
  const requireVerification = featuresConfig.jobPosting.requireVerification;

  const [job] = await db
    .insert(jobs)
    .values({
      source: "posted" as const,
      externalId: null,
      title: input.title,
      description: input.description,
      companyId: company.id,
      companyName: company.name,
      locationText: input.locations.map((l) => l.display_label).join(", ") || null,
      locations: toLocations(input.locations),
      applicationUrl: input.applicationUrl,
      employmentType: input.employmentType ?? null,
      hasRemote: input.hasRemote,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      salaryCurrency: input.salaryCurrency ?? null,
      salaryText: input.salaryText ?? null,
      published: now,
      expiresAt,
      status: requireVerification ? ("pending" as const) : ("approved" as const),
      requiresVerification: requireVerification,
    })
    .returning();

  revalidatePath(JOB_POSTINGS_PATH);
  revalidatePath("/");
  return job;
}

export type UpdateJobPostingInput = Partial<
  Omit<CreateJobPostingInput, "companyId">
> & { id: string };

/**
 * Ownership check is via companyId -> companies.ownerId, not a direct
 * userId column on `jobs` (there isn't one - `jobs` has no notion of
 * "poster", only "company", matching how a real job posting belongs to an
 * employer, not an individual account). Re-editing does NOT reset status
 * back to "pending" - v1 has no re-review-on-edit policy; that's a
 * phase 3 policy decision, not this phase's to make.
 */
export async function updateJobPosting(input: UpdateJobPostingInput) {
  const userId = await requireUserId();
  const db = requireDb();

  const [existing] = await db
    .select({ id: jobs.id, companyId: jobs.companyId })
    .from(jobs)
    .where(and(eq(jobs.id, input.id), eq(jobs.source, "posted")))
    .limit(1);
  if (!existing?.companyId || !(await ownsCompany(userId, existing.companyId))) {
    throw new Error("You can only edit your own job postings.");
  }

  const patch: Partial<typeof jobs.$inferInsert> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.locations !== undefined) {
    patch.locations = toLocations(input.locations);
    patch.locationText = input.locations.map((l) => l.display_label).join(", ") || null;
  }
  if (input.employmentType !== undefined) patch.employmentType = input.employmentType;
  if (input.hasRemote !== undefined) patch.hasRemote = input.hasRemote;
  if (input.salaryMin !== undefined) patch.salaryMin = input.salaryMin;
  if (input.salaryMax !== undefined) patch.salaryMax = input.salaryMax;
  if (input.salaryCurrency !== undefined) patch.salaryCurrency = input.salaryCurrency;
  if (input.salaryText !== undefined) patch.salaryText = input.salaryText;
  if (input.applicationUrl !== undefined) patch.applicationUrl = input.applicationUrl;

  await db.update(jobs).set(patch).where(eq(jobs.id, input.id));

  revalidatePath(JOB_POSTINGS_PATH);
  revalidatePath("/");
  revalidatePath(`/jobs/${input.id}`);
}

export async function deleteJobPosting(id: string) {
  const userId = await requireUserId();
  const db = requireDb();

  const [existing] = await db
    .select({ id: jobs.id, companyId: jobs.companyId })
    .from(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.source, "posted")))
    .limit(1);
  if (!existing?.companyId || !(await ownsCompany(userId, existing.companyId))) {
    throw new Error("You can only delete your own job postings.");
  }

  await db.delete(jobs).where(eq(jobs.id, id));

  revalidatePath(JOB_POSTINGS_PATH);
  revalidatePath("/");
}

/** All source="posted" jobs under any company the current user owns, for the "My postings" dashboard. */
export async function getMyJobPostings() {
  const userId = await requireUserId();
  const db = requireDb();

  return db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .innerJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.source, "posted"), eq(companies.ownerId, userId)));
}
