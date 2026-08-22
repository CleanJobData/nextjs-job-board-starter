import { and, desc, eq } from "drizzle-orm";
import { listJobs } from "@/jobs/lib/api";
import { requireDb } from "@/lib/db/client";
import type { Job } from "@/lib/api/types";
import type { ListQuery } from "@/jobs/lib/query-types";
import jobSyncConfig from "../job-sync.config";
import { cachedJobs, syncRuns } from "../db/schema";
import { ensureCompaniesFetched, getEmployerId, refreshStaleCompanies } from "./companies";
import { pollExpiredJobs, pruneExpiredJobs } from "./expire";

/** syncFiltersSchema uses camelCase (config-file convention); ListQuery uses CleanJobData's own snake_case param names. */
function toListQuery(filters: typeof jobSyncConfig.syncFilters): Partial<ListQuery> {
  return {
    title: filters.title,
    location: filters.location,
    city_id: filters.cityId,
    state_id: filters.stateId,
    country_id: filters.countryId,
    remote_only: filters.remoteOnly,
    remote_type: filters.remoteType,
    experience_level: filters.experienceLevel,
    employment_type: filters.employmentType,
    min_salary: filters.minSalary,
    max_salary: filters.maxSalary,
    require_salary: filters.requireSalary,
    company_name: filters.companyName,
    company_website_url: filters.companyWebsiteUrl,
    source_domain: filters.sourceDomain,
    employer_id: filters.employerId,
    created_max_age: filters.createdMaxAge,
    include_remote_without_country: filters.includeRemoteWithoutCountry,
  };
}

type RunKind = "incremental" | "expired_check" | "company_refresh";

async function getLastSuccessfulRun(kind: RunKind) {
  const db = requireDb();
  const [run] = await db
    .select()
    .from(syncRuns)
    .where(and(eq(syncRuns.kind, kind), eq(syncRuns.status, "success")))
    .orderBy(desc(syncRuns.startedAt))
    .limit(1);
  return run ?? null;
}

/** companyName stays a denormalized convenience copy from the job's embedded snapshot (fast search) - companyId/the real company record comes from features/job-sync/lib/companies.ts, not this embedded object. */
function toJobRow(job: Job, companyId: string | null, expiresAt: Date) {
  return {
    id: job.id,
    title: job.title,
    companyId,
    companyName: job.company?.name ?? null,
    locationText: job.location,
    locations: job.locations ?? [],
    applicationUrl: job.application_url,
    language: job.language,
    employmentType: job.employment_type,
    hasRemote: job.has_remote,
    isActive: job.is_active,
    sourceExpiredAt: job.expired_at ? new Date(job.expired_at) : null,
    experienceLevel: job.experience_level,
    experienceLevels: job.experience_levels ?? [],
    salaryMin: job.salary_min,
    salaryMax: job.salary_max,
    salaryCurrency: job.salary_currency,
    salaryText: job.salary_text,
    published: new Date(job.published),
    expiresAt,
  };
}

/**
 * Fetches only jobs newer than the last successful run's watermark
 * (sort_by=published, stop at the first already-seen job) - cheap, meant
 * to run hourly. Self-throttled by incrementalSyncIntervalHours so it's
 * safe to call this from a scheduler more often than that.
 */
async function runIncrementalSync() {
  const db = requireDb();
  const lastRun = await getLastSuccessfulRun("incremental");

  if (lastRun?.finishedAt) {
    const dueAt = lastRun.finishedAt.getTime() + jobSyncConfig.incrementalSyncIntervalHours * 60 * 60 * 1000;
    if (Date.now() < dueAt) {
      return { ran: false as const, reason: "not due yet" };
    }
  }

  const watermark = lastRun?.watermark ?? null;
  const expiresAt = new Date(Date.now() + jobSyncConfig.staleAfterDays * 24 * 60 * 60 * 1000);

  const [run] = await db.insert(syncRuns).values({ kind: "incremental" }).returning();
  if (!run) throw new Error("Failed to create sync_runs row.");

  let jobsUpserted = 0;
  let newestPublished = watermark;

  try {
    let cursor: string | undefined;
    pageLoop: for (let page = 0; page < jobSyncConfig.maxPagesPerIncrementalRun; page++) {
      const response = await listJobs({
        cursor,
        sort_by: "published",
        limit: jobSyncConfig.pageLimit,
        ...toListQuery(jobSyncConfig.syncFilters),
      });
      if (response.data.length === 0) break;

      const pageJobs: Job[] = [];
      for (const job of response.data) {
        const published = new Date(job.published);
        if (watermark && published <= watermark) break pageLoop;
        pageJobs.push(job);
      }

      // Fetch any never-seen-before employers for this page's jobs before upserting the jobs themselves,
      // so cachedJobs.companyId's FK always has a real companies row to point at.
      const employerIds = pageJobs.map(getEmployerId).filter((id): id is string => id !== null);
      await ensureCompaniesFetched(employerIds);

      for (const job of pageJobs) {
        const row = toJobRow(job, getEmployerId(job), expiresAt);
        await db.insert(cachedJobs).values(row).onConflictDoUpdate({ target: cachedJobs.id, set: row });
        jobsUpserted++;

        const published = new Date(job.published);
        if (!newestPublished || published > newestPublished) newestPublished = published;
      }

      if (!response.pagination.next_page) break;
      cursor = response.pagination.next_page;
    }

    await db
      .update(syncRuns)
      .set({ status: "success", finishedAt: new Date(), jobsUpserted, watermark: newestPublished })
      .where(eq(syncRuns.id, run.id));

    return { ran: true as const, jobsUpserted };
  } catch (error) {
    await db
      .update(syncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        jobsUpserted,
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(syncRuns.id, run.id));
    throw error;
  }
}

/**
 * Polls GET /jobs/expired and flags matching cached rows inactive, plus
 * the staleAfterDays backstop delete. Self-throttled by
 * expiredCheckIntervalHours - independent cadence from the incremental
 * pass since detecting removals doesn't need to happen as often.
 */
async function runExpiredCheck() {
  const db = requireDb();
  const lastRun = await getLastSuccessfulRun("expired_check");

  if (lastRun?.finishedAt) {
    const dueAt = lastRun.finishedAt.getTime() + jobSyncConfig.expiredCheckIntervalHours * 60 * 60 * 1000;
    if (Date.now() < dueAt) {
      return { ran: false as const, reason: "not due yet" };
    }
  }

  const [run] = await db.insert(syncRuns).values({ kind: "expired_check" }).returning();
  if (!run) throw new Error("Failed to create sync_runs row.");

  try {
    const flagged = await pollExpiredJobs();
    const pruned = await pruneExpiredJobs();
    const jobsExpired = flagged + pruned;

    await db
      .update(syncRuns)
      .set({ status: "success", finishedAt: new Date(), jobsExpired })
      .where(eq(syncRuns.id, run.id));

    return { ran: true as const, jobsExpired };
  } catch (error) {
    await db
      .update(syncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(syncRuns.id, run.id));
    throw error;
  }
}

/**
 * Refreshes canonical company data for every employer already referenced
 * in cachedJobs, via a cheap batched staleness check before paying for
 * individual GET /companies/:id re-fetches - see
 * features/job-sync/lib/companies.ts's refreshStaleCompanies(). Company
 * info changes far less often than job listings, so this defaults to a
 * weekly cadence (companyRefreshIntervalHours), independent of the other
 * two phases.
 */
async function runCompanyRefresh() {
  const db = requireDb();
  const lastRun = await getLastSuccessfulRun("company_refresh");

  if (lastRun?.finishedAt) {
    const dueAt = lastRun.finishedAt.getTime() + jobSyncConfig.companyRefreshIntervalHours * 60 * 60 * 1000;
    if (Date.now() < dueAt) {
      return { ran: false as const, reason: "not due yet" };
    }
  }

  const [run] = await db.insert(syncRuns).values({ kind: "company_refresh" }).returning();
  if (!run) throw new Error("Failed to create sync_runs row.");

  try {
    const companiesRefreshed = await refreshStaleCompanies();

    await db
      .update(syncRuns)
      .set({ status: "success", finishedAt: new Date(), jobsUpserted: companiesRefreshed })
      .where(eq(syncRuns.id, run.id));

    return { ran: true as const, companiesRefreshed };
  } catch (error) {
    await db
      .update(syncRuns)
      .set({
        status: "error",
        finishedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : String(error),
      })
      .where(eq(syncRuns.id, run.id));
    throw error;
  }
}

// Exported for features/job-sync/feature.ts's cronTasks registration (see
// lib/cron/runTasks.ts for how these get isolated from each other and from
// other features' cron tasks when actually run).
export { runIncrementalSync, runExpiredCheck, runCompanyRefresh };
