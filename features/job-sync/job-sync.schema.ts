import { z } from "zod";

/**
 * Which jobs from CleanJobData's full catalog get pulled into this
 * deployment's own database in the first place - set once by the site
 * owner, not exposed to their visitors (that's JobFilters.tsx, a separate,
 * still-live-API-only concern today). Mirrors the same param shape
 * lib/api/jobs.ts's listJobs() already accepts, since these are forwarded
 * straight through to the sync's list calls - nothing new to learn.
 *
 * `location` is 2-letter ISO 3166-1 country codes ONLY (e.g. "US", "CA") -
 * NOT free text/country names. CleanJobData's backend silently drops
 * anything that doesn't match that exact pattern rather than erroring
 * (normalizeJobListQuery.js's parseCommaSeparatedCountryCodes()), so a
 * typo there would otherwise just quietly mean "no location filter" with
 * no indication anything was wrong - the regex below catches that loudly
 * at config-parse time instead. cityId/stateId/countryId are CleanJobData's
 * own internal numeric ids, not human-guessable - only use them if you
 * already know/have looked them up (see features/job-sync/README.md).
 */
export const syncFiltersSchema = z.object({
  title: z.string().optional(),
  location: z.array(z.string().regex(/^[A-Za-z]{2}$/, "location must be 2-letter ISO country codes, e.g. \"US\"")).optional(),
  cityId: z.array(z.number()).optional(),
  stateId: z.array(z.number()).optional(),
  countryId: z.array(z.number()).optional(),
  remoteOnly: z.boolean().optional(),
  /** One of the backend's 4 remote sub-types - independent of remoteOnly (e.g. remoteOnly:true + remoteType:"hybrid" is a valid, if narrow, combination). */
  remoteType: z.enum(["fully_remote", "remote_country", "remote_region", "hybrid"]).optional(),
  experienceLevel: z.array(z.enum(["EN", "MI", "SE", "EX"])).optional(),
  /** Exact backend allowlist (jobCanonicalRules.js's EMPLOYMENT_TYPES) - anything else 400s server-side rather than being silently dropped. */
  employmentType: z.array(z.enum([
    "FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY",
    "FREELANCE", "APPRENTICESHIP", "VOLUNTEER", "PER_DIEM", "OTHER",
  ])).optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  /** Only takes effect when minSalary is also set (backend-side dependency, not enforced here). */
  requireSalary: z.boolean().optional(),
  companyName: z.string().optional(),
  /** Free-text substring match against the company's website URL. */
  companyWebsiteUrl: z.string().optional(),
  /**
   * Filters on the job's internal source/ATS-board domain (e.g. the job
   * board platform that hosted the posting) - NOT the company's own
   * website domain, despite the backend param being named `domain`.
   * Verified against real data: `domain=hm.com` (a real company's website)
   * returned zero results, confirming this matches something else
   * entirely - a niche, technical filter, not "jobs from this company."
   */
  sourceDomain: z.string().optional(),
  /** Restrict sync to specific known employers, by CleanJobData's own employer id (see features/job-sync/lib/companies.ts's getEmployerId()) - not human-guessable, only useful if you already know the id(s). */
  employerId: z.array(z.string()).optional(),
  /** Duration string (e.g. "30d") - jobs created after this window. Independent of publishedAfter/maxAge, which filter on `published`, not creation time. */
  createdMaxAge: z.string().optional(),
  /** Include remote jobs that have no resolved country, which would otherwise be excluded by a location filter. */
  includeRemoteWithoutCountry: z.boolean().optional(),
});

export type SyncFilters = z.infer<typeof syncFiltersSchema>;

/**
 * Implementation tuning for job-sync - deliberately separate from
 * features.config.ts (which only holds enabled/guestAccess, the
 * cross-cutting flags every feature has). These knobs are specific to how
 * THIS feature syncs, and don't belong in the shared root config.
 */
export const jobSyncSchema = z.object({
  /** Only jobs matching these filters get synced into this deployment's DB - see syncFiltersSchema above. Empty object = sync everything. */
  syncFilters: syncFiltersSchema.default({}),
  /** How often the incremental "fetch new jobs" pass is allowed to actually run, in hours. The route no-ops if called more often than this. */
  incrementalSyncIntervalHours: z.number().default(1),
  /** How many jobs to request per page during the incremental pass. Match this to your CleanJobData plan's max_list_limit (see features/job-sync/README.md) - defaults to the API's own default (20) if unset. */
  pageLimit: z.number().default(20),
  /** Safety backstop on the incremental pass - stop after this many pages even if the "reached last watermark" check hasn't tripped, so a bug can't loop forever. */
  maxPagesPerIncrementalRun: z.number().default(25),
  /** How often the expired-jobs check is allowed to run, in hours. Separate cadence from the incremental sync - detecting removals doesn't need to happen as often as picking up new jobs. */
  expiredCheckIntervalHours: z.number().default(24),
  /** Passed as GET /jobs/expired's max_age param. Should be >= expiredCheckIntervalHours plus some overlap margin, so a late/skipped run doesn't miss expirations that happened in the gap. */
  expiredCheckWindowHours: z.number().default(30),
  /** Backstop TTL in days - a cached job gets pruned at this age regardless of whether the expired-check has confirmed it's gone. Belt-and-suspenders against diff logic failing silently for an extended period. */
  staleAfterDays: z.number().default(60),
  /** How often the company-refresh pass is allowed to run, in hours. Company info changes far less often than job listings, so this defaults to weekly, not hourly. */
  companyRefreshIntervalHours: z.number().default(168),
  /**
   * How many already-known companies get re-fetched (GET /companies/:id,
   * oldest-refreshed-first by our own `updatedAt`) per company-refresh run.
   * There's no cheap way to detect which companies actually need
   * refreshing - CleanJobData never exposes `website_enrichment_at` (the
   * field that would mean something here), only `last_scraped_at` (job-
   * scraping cadence, unrelated to profile changes) - so this is a bounded
   * rotation, not staleness detection: every run costs exactly this many
   * GET /companies/:id calls, and every company gets refreshed roughly
   * once every (total known companies / this number) runs.
   */
  companyRefreshBatchSize: z.number().default(100),
});

export type JobSyncConfig = z.infer<typeof jobSyncSchema>;
