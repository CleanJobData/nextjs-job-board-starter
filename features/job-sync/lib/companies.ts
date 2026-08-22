import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
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
    externalId: detail.id,
    source: "cleanjobdata" as const,
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

/** Returns the internal companies.id (UUID) of the upserted row - callers need this to satisfy jobs.companyId's FK, which points at `id`, not `externalId`. */
async function upsertCompanyDetail(db: Db, employerId: string): Promise<string> {
  const detail = await getCompanyDetail(employerId);
  const row = toCompanyRow(detail);
  const [upserted] = await db
    .insert(companies)
    .values(row)
    .onConflictDoUpdate({ target: [companies.source, companies.externalId], set: row })
    .returning({ id: companies.id });
  if (!upserted) throw new Error(`Failed to upsert company row for employer ${employerId}.`);
  return upserted.id;
}

/**
 * For any employer id in this batch of jobs we don't already have a
 * companies row for, fetches the full canonical record (GET
 * /companies/:id) and upserts it. Called from the incremental sync pass -
 * new employers get real data immediately, not just whatever partial
 * snapshot happened to be embedded in one job response.
 *
 * Returns a map from CleanJobData employer id -> internal companies.id
 * (UUID), for every id in `employerIds` (whether already-known or just
 * fetched) - sync.ts needs the internal id, not the employer id, to
 * populate jobs.companyId (its FK target is companies.id, which is no
 * longer the same value as the employer id - see companies table's doc
 * comment).
 */
export async function ensureCompaniesFetched(employerIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(employerIds)];
  const result = new Map<string, string>();
  if (uniqueIds.length === 0) return result;

  const db = requireDb();
  const existing = await db
    .select({ id: companies.id, externalId: companies.externalId })
    .from(companies)
    .where(and(eq(companies.source, "cleanjobdata"), inArray(companies.externalId, uniqueIds)));
  for (const row of existing) {
    if (row.externalId) result.set(row.externalId, row.id);
  }

  const missingIds = uniqueIds.filter((id) => !result.has(id));
  for (const id of missingIds) {
    const internalId = await upsertCompanyDetail(db, id);
    result.set(id, internalId);
  }

  return result;
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
    .select({ externalId: companies.externalId })
    .from(companies)
    .where(and(eq(companies.source, "cleanjobdata"), isNotNull(companies.externalId)))
    .orderBy(asc(companies.updatedAt))
    .limit(jobSyncConfig.companyRefreshBatchSize);

  for (const { externalId } of toRefresh) {
    if (externalId) await upsertCompanyDetail(db, externalId);
  }

  return toRefresh.length;
}
