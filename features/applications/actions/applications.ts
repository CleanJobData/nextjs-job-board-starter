"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
import { jobs } from "@/features/job-sync/db/schema";
import { getJobById } from "@/jobs/lib/api";
import { applications } from "../db/schema";

const APPLICATIONS_PATH = "/applications";

async function requireUserId(): Promise<string> {
  const access = await checkAccess("applications");
  if (access.status !== "ok") {
    throw new Error("Applications feature is disabled or you must sign in to use it.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must sign in to track applications.");
  }
  return userId;
}

export type TrackApplicationInput = {
  jobId: string;
  jobTitle: string;
  companyName?: string | null;
  companyLogo?: string | null;
  jobUrl?: string | null;
};

/**
 * Tracks a job, or updates the existing tracked row if this user already
 * tracked this jobId (see the unique index on (userId, jobId)).
 *
 * `input.jobId` is the CleanJobData EXTERNAL id (TrackApplicationButton's
 * callers, e.g. JobDetailTrackAction, pass job.id straight from the
 * CleanJobData API shape) - NOT jobs.id, which is now an internal UUID
 * decoupled from that id space (see jobs table's doc comment in
 * features/job-sync/db/schema.ts). So we resolve it to the internal id via
 * (source: "cleanjobdata", externalId) before inserting.
 *
 * If no matching row is found - job-sync disabled, or the job just hasn't
 * been synced yet - we deliberately do NOT throw or fabricate a `jobs` row
 * (we only have jobId/jobTitle/companyName/jobUrl here, not a full job
 * record). We fall back to storing jobId: null and rely purely on the
 * jobTitle/companyName/jobUrl snapshot - applications must keep working
 * even when job-sync is off.
 */
export async function trackApplication(input: TrackApplicationInput) {
  const userId = await requireUserId();
  const db = requireDb();

  const [matchedJob] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.source, "cleanjobdata"), eq(jobs.externalId, input.jobId)))
    .limit(1);

  const row = {
    userId,
    jobId: matchedJob?.id ?? null,
    jobTitle: input.jobTitle,
    companyName: input.companyName ?? null,
    companyLogo: input.companyLogo ?? null,
    jobUrl: input.jobUrl ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(applications)
    .values({ ...row, status: "saved" as const })
    .onConflictDoUpdate({
      target: [applications.userId, applications.jobId],
      set: row,
    });

  revalidatePath(APPLICATIONS_PATH);
}

export type ApplicationJobDetail = {
  description: string | null;
  locationText: string | null;
  employmentType: string | null;
  hasRemote: boolean;
  salaryText: string | null;
};

/**
 * Extra job context for the detail panel, beyond the snapshot fields
 * already stored on the application row (title/company/logo/url) - fetched
 * on demand when the panel opens rather than stored, since it's genuinely
 * live/full data (a description in particular can be long and isn't
 * needed until someone actually opens the panel).
 *
 * `jobId` here is `applications.jobId` - the internal `jobs.id`, not
 * CleanJobData's external id - so this looks the row up directly by id,
 * with NO source/status filter (unlike listJobsFromCache()/
 * getPostedJobById(), which are public-facing and must hide
 * pending/rejected postings): this is the application's own owner
 * viewing their own tracked job, so a pending/rejected posting they
 * created themselves must still show its full detail here.
 */
export async function getApplicationJobDetail(jobId: string): Promise<ApplicationJobDetail | null> {
  await requireUserId();
  const db = requireDb();

  const [row] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!row) return null;

  if (row.source === "posted") {
    return {
      description: row.description,
      locationText: row.locationText,
      employmentType: row.employmentType,
      hasRemote: row.hasRemote,
      salaryText: row.salaryText,
    };
  }

  // source === "cleanjobdata": list-view rows never carry a description
  // (job-sync's cache only stores what /jobs' list endpoint returns), so
  // getting the full text means one live GET /jobs/:id call - same
  // live-fetch-on-open pattern the job detail page itself already uses.
  if (!row.externalId) return null;
  try {
    const live = await getJobById(row.externalId);
    return {
      description: live.description ?? null,
      locationText: live.location,
      employmentType: live.employment_type,
      hasRemote: live.has_remote,
      salaryText: live.salary_text,
    };
  } catch {
    // Job may have expired/been removed from CleanJobData since it was
    // tracked - fall back to no extra detail rather than erroring the
    // whole panel open.
    return null;
  }
}

export type ApplicationStatus = "saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn";

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const userId = await requireUserId();
  const db = requireDb();

  await db
    .update(applications)
    .set({
      status,
      appliedAt: status === "applied" ? new Date() : undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));

  revalidatePath(APPLICATIONS_PATH);
}

export async function updateApplicationNotes(id: string, notes: string) {
  const userId = await requireUserId();
  const db = requireDb();

  await db
    .update(applications)
    .set({ notes, updatedAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, userId)));

  revalidatePath(APPLICATIONS_PATH);
}

export async function deleteApplication(id: string) {
  const userId = await requireUserId();
  const db = requireDb();

  await db.delete(applications).where(and(eq(applications.id, id), eq(applications.userId, userId)));

  revalidatePath(APPLICATIONS_PATH);
}
