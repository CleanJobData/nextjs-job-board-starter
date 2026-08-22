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
  /** Logo file, if the poster attached one - uploaded via lib/storage, not stored inline. */
  logo?: { buffer: Buffer; filename: string; contentType: string } | null;
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
    assertValidUpload({ buffer: input.logo.buffer, contentType: input.logo.contentType });
    const uploaded = await getStorageAdapter().upload({
      buffer: input.logo.buffer,
      filename: input.logo.filename,
      contentType: input.logo.contentType,
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
