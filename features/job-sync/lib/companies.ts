import { asc, inArray } from "drizzle-orm";
import { getCompanyDetail } from "@/lib/api/companies";
import { requireDb } from "@/lib/db/client";
import type { CompanyDetail, Job } from "@/lib/api/types";
import jobSyncConfig from "../job-sync.config";
import { companies } from "../db/schema";

type Db = ReturnType<typeof requireDb>;

/** See Job.employer_id/ats_employer_id's doc comments in lib/api/types.ts - real customer deployments only ever have employer_id. */
export function getEmployerId(job: Job): string | null {
  return job.employer_id ?? job.ats_employer_id ?? null;
}

function toCompanyRow(detail: CompanyDetail) {
  const enrichment = detail.website_enrichment;
  const meta = enrichment?.meta;
  const founded = meta?.founded ? Number.parseInt(meta.founded, 10) : NaN;
  const specialties = meta?.specialties
    ? meta.specialties.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: detail.id,
    name: meta?.name || detail.display_name,
    description: meta?.description ?? null,
    logo: meta?.logoUrl ?? detail.logo_url,
    websiteUrl: detail.website_url,
    linkedinUrl: enrichment?.social?.linkedin ?? null,
    twitterUrl: enrichment?.social?.twitter ?? null,
    githubUrl: enrichment?.social?.github ?? null,
    youtubeUrl: enrichment?.social?.youtube ?? null,
    facebookUrl: enrichment?.social?.facebook ?? null,
    instagramUrl: enrichment?.social?.instagram ?? null,
    team: enrichment?.team ?? [],
    employeeCount: meta?.employee_count == null ? null : String(meta.employee_count),
    industry: meta?.industry ?? null,
    headquarters: meta?.headquarters ?? null,
    founded: Number.isNaN(founded) ? null : founded,
    specialties,
    location: meta?.location ?? null,
    registrableDomain: enrichment?.registrableDomain ?? null,
    sourceLastScrapedAt: new Date(detail.last_scraped_at),
    updatedAt: new Date(),
  };
}

async function upsertCompanyDetail(db: Db, employerId: string) {
  const detail = await getCompanyDetail(employerId);
  const row = toCompanyRow(detail);
  await db.insert(companies).values(row).onConflictDoUpdate({ target: companies.id, set: row });
}

/**
 * For any employer id in this batch of jobs we don't already have a
 * companies row for, fetches the full canonical record (GET
 * /companies/:id) and upserts it. Called from the incremental sync pass -
 * new employers get real data immediately, not just whatever partial
 * snapshot happened to be embedded in one job response.
 */
export async function ensureCompaniesFetched(employerIds: string[]) {
  const uniqueIds = [...new Set(employerIds)];
  if (uniqueIds.length === 0) return;

  const db = requireDb();
  const existing = await db.select({ id: companies.id }).from(companies).where(inArray(companies.id, uniqueIds));
  const existingIds = new Set(existing.map((r) => r.id));
  const missingIds = uniqueIds.filter((id) => !existingIds.has(id));

  for (const id of missingIds) {
    await upsertCompanyDetail(db, id);
  }
}

/**
 * Periodic pass (companyRefreshIntervalHours) over every company we
 * already know about. There's no reliable way to cheaply detect "did this
 * company's profile actually change" - CleanJobData's /companies API
 * exposes `last_scraped_at` (job-scraping cadence, ~12h per employer) but
 * never `website_enrichment_at`/`linkedin_enriched_at` (the fields that
 * would actually indicate a profile change), and the batch/list endpoint
 * doesn't return enrichment data at all regardless (only GET
 * /companies/:id does) - so a cheap pre-check can't tell us anything
 * useful here. Instead of pretending otherwise, this just rotates through
 * known companies oldest-refreshed-first (our own `updatedAt`), re-fetching
 * the oldest `companyRefreshBatchSize` via GET /companies/:id directly each
 * run - an honest, bounded-cost rotation rather than fake staleness
 * detection.
 */
export async function refreshStaleCompanies(): Promise<number> {
  const db = requireDb();
  const toRefresh = await db
    .select({ id: companies.id })
    .from(companies)
    .orderBy(asc(companies.updatedAt))
    .limit(jobSyncConfig.companyRefreshBatchSize);

  for (const { id } of toRefresh) {
    await upsertCompanyDetail(db, id);
  }

  return toRefresh.length;
}
