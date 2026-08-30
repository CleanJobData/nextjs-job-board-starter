"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { checkAccess } from "@/features/authGuard";
import { companies } from "@/features/job-sync/db/schema";
import { getStorageAdapter } from "@/lib/storage";
import { assertValidUpload } from "@/lib/storage/types";

async function requireUserId(): Promise<string> {
  const access = await checkAccess("jobPosting");
  if (access.status !== "ok") {
    throw new Error("Job posting is disabled or you must sign in to use it.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("You must sign in to create a company.");
  }
  return userId;
}

/** Companies the current user owns - the source list for job-posting's company picker. */
export async function getMyCompanies() {
  const userId = await requireUserId();
  const db = requireDb();
  return db.select().from(companies).where(eq(companies.ownerId, userId));
}

export type CreateCompanyInput = {
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  githubUrl?: string | null;
  youtubeUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  employeeCount?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  founded?: number | null;
  /**
   * Logo file, if the poster attached one - uploaded via lib/storage, not
   * stored inline. Takes the raw File (not a pre-converted Buffer): a Node
   * Buffer instance doesn't survive the Server Action wire format intact
   * (arrives here as a plain object, not a real buffer), but File is
   * natively supported across that boundary - converted to a real Buffer
   * below, server-side, where Buffer is guaranteed to be the real thing.
   */
  logo?: File | null;
};

/**
 * Creates a brand-new "posted" company for the current user - the ONLY
 * company-creation path this phase builds. Claiming an existing
 * source="cleanjobdata" company (setting ownerId on an ingested row) is a
 * deliberately separate, admin-gated flow left for phase 3's admin
 * dashboard (it requires verifying the claimant actually represents that
 * real-world employer) - not built here, not even stubbed beyond this
 * comment, per the phase 2 spec.
 */
export async function createCompany(input: CreateCompanyInput) {
  const userId = await requireUserId();
  const db = requireDb();

  let logoUrl: string | null = null;
  if (input.logo) {
    const buffer = Buffer.from(await input.logo.arrayBuffer());
    const contentType = input.logo.type;
    assertValidUpload({ buffer, contentType });
    const uploaded = await getStorageAdapter().upload({
      buffer,
      filename: input.logo.name,
      contentType,
      scope: "company-logos",
    });
    logoUrl = uploaded.url;
  }

  const [company] = await db
    .insert(companies)
    .values({
      source: "posted" as const,
      externalId: null,
      ownerId: userId,
      name: input.name,
      description: input.description ?? null,
      logo: logoUrl,
      websiteUrl: input.websiteUrl ?? null,
      linkedinUrl: input.linkedinUrl ?? null,
      twitterUrl: input.twitterUrl ?? null,
      githubUrl: input.githubUrl ?? null,
      youtubeUrl: input.youtubeUrl ?? null,
      facebookUrl: input.facebookUrl ?? null,
      instagramUrl: input.instagramUrl ?? null,
      employeeCount: input.employeeCount ?? null,
      industry: input.industry ?? null,
      headquarters: input.headquarters ?? null,
      founded: input.founded ?? null,
      // team/specialties/location/registrableDomain/sourceLastScrapedAt:
      // all cleanjobdata-enrichment-specific fields with no meaningful value
      // for a locally-created company - left at their column defaults
      // (empty array / null), same reasoning as jobs' cleanjobdata-only
      // columns below.
    })
    .returning();

  revalidatePath("/job-postings");
  return company;
}

export type UpdateCompanyInput = Omit<CreateCompanyInput, "logo"> & {
  id: string;
  /**
   * Logo tri-state, expressed via two independent fields rather than one
   * nullable prop, because the three states this needs to distinguish
   * ("leave it exactly as-is", "replace with this new file", "clear it to
   * null") can't be told apart from a single `File | null` value alone -
   * `null` would be ambiguous between "unchanged" and "cleared". The
   * calling form expresses this the same way native multipart forms
   * already do for "did the user touch this field at all": omit `logo`
   * (or pass undefined) for "unchanged", pass a real `File` to replace it,
   * or pass `removeLogo: true` (with no `logo`) to clear it. `removeLogo`
   * is ignored if `logo` is also provided - a new file always wins.
   */
  logo?: File | null;
  removeLogo?: boolean;
};

/**
 * Updates a company the current user owns. Only ever touches
 * source="posted" rows - a source="cleanjobdata" ingested company's real,
 * scraped data must never be edited through this self-service path, even
 * in the hypothetical case where a future claim-flow left `ownerId` set on
 * one (see createCompany()'s doc comment on why claiming isn't built yet).
 */
export async function updateCompany(input: UpdateCompanyInput) {
  const userId = await requireUserId();
  const db = requireDb();

  const [existing] = await db
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.id, input.id),
        eq(companies.ownerId, userId),
        eq(companies.source, "posted"),
      ),
    )
    .limit(1);
  if (!existing) {
    throw new Error("You can only edit a company you own.");
  }

  const patch: Partial<typeof companies.$inferInsert> = {
    name: input.name,
    description: input.description ?? null,
    websiteUrl: input.websiteUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? null,
    twitterUrl: input.twitterUrl ?? null,
    githubUrl: input.githubUrl ?? null,
    youtubeUrl: input.youtubeUrl ?? null,
    facebookUrl: input.facebookUrl ?? null,
    instagramUrl: input.instagramUrl ?? null,
    employeeCount: input.employeeCount ?? null,
    industry: input.industry ?? null,
    headquarters: input.headquarters ?? null,
    founded: input.founded ?? null,
  };

  if (input.logo) {
    const buffer = Buffer.from(await input.logo.arrayBuffer());
    const contentType = input.logo.type;
    assertValidUpload({ buffer, contentType });
    const uploaded = await getStorageAdapter().upload({
      buffer,
      filename: input.logo.name,
      contentType,
      scope: "company-logos",
    });
    patch.logo = uploaded.url;
  } else if (input.removeLogo) {
    patch.logo = null;
  }
  // else: no new file and no removal requested - `logo` is left out of the
  // patch entirely, leaving the existing column value untouched.

  const [company] = await db
    .update(companies)
    .set(patch)
    .where(eq(companies.id, input.id))
    .returning();

  revalidatePath("/job-postings");
  return company;
}
