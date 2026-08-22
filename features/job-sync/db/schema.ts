import { pgTable, text, timestamp, boolean, integer, jsonb, index, uniqueIndex } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { users } from "@/features/auth/db/schema";
import type { CompanyTeamMember, Location } from "@/lib/api/types";

/**
 * One row per employer, discriminated by `source` just like `jobs`:
 * - "cleanjobdata": ingested from CleanJobData. `externalId` holds their
 *   stable employer id (the `employer_id` field on a job - see
 *   Job.employer_id's doc comment) - GET /companies?employer_id=... and
 *   GET /companies/:id both key on this same value.
 * - "posted": a locally-created employer profile (job-posting feature,
 *   claim-profile model). `externalId` is null.
 *
 * `id` is an internally-generated UUID, NOT CleanJobData's employer id -
 * this used to be the employer id directly (a real, enforced foreign key
 * from jobs.companyId, not a soft reference), but that reasoning doesn't
 * survive a table that must also hold locally-created companies with no
 * CleanJobData id at all - same superseded reasoning as `jobs.id` (see that
 * table's doc comment). `jobs.companyId` still references this `id`
 * unchanged; use `externalId` (scoped by `source`), never `id`, whenever
 * matching against anything from the CleanJobData API.
 *
 * `ownerId` is nullable and `onDelete: "set null"`: an ingested company has
 * no owner until a real employer signs up, gets admin-verified, and claims
 * it (job-posting's claim-profile model - admin just sets ownerId to their
 * users.id, no duplicate company row). Losing the owner (user deleted)
 * shouldn't delete the company or cascade into deleting its jobs, so this
 * is SET NULL, not CASCADE - the company reverts to unclaimed.
 *
 * The unique index on (source, externalId) mirrors jobsSourceExternalIdIdx
 * - Postgres unique indexes treat NULL as distinct, so unlimited
 * source="posted" rows (externalId always null) coexist fine, while two
 * syncs of the same CleanJobData employer correctly upsert the same row.
 *
 * Populated by features/job-sync/lib/companies.ts, NOT from the `company`
 * object embedded in a job response (that embedded object is a partial,
 * job-response-shaped snapshot). New employers get a full
 * GET /companies/:id fetch the first time they're seen; already-known
 * ones get refreshed periodically (job-sync.config.ts's
 * companyRefreshIntervalHours) via a bounded rotation - oldest `updatedAt`
 * first, not a staleness check, since CleanJobData exposes no field that
 * actually indicates a profile change (see companies.ts's
 * refreshStaleCompanies() doc comment). Synced by UPSERT so updating a
 * company's info (logo, industry, etc.) touches one row here instead of
 * every job that company has posted.
 *
 * `team` stays JSONB - it's an array of objects (one-to-many), and fully
 * normalizing it into its own child table would be real added complexity
 * for something rarely queried. Every other company field is scalar and
 * gets a real column, per the "nothing hides in an opaque blob" principle.
 *
 * All timestamps use `withTimezone: true` (timestamptz), not the bare
 * "timestamp without time zone" Drizzle defaults to. We write timestamps
 * through two different paths - app-side `new Date()` (e.g. sync.ts's
 * expiresAt) and DB-side `defaultNow()` - and without an explicit
 * timezone, both just store a naive number with no zone attached. That
 * only stays consistent by accident (this local Postgres happens to have
 * session TimeZone=UTC); a customer's managed Postgres could default to
 * something else, silently drifting the two write paths apart and
 * corrupting exactly the comparisons this feature depends on (expiresAt <
 * now(), watermark <= published). timestamptz stores an absolute instant
 * regardless of session timezone, removing the whole class of bug.
 */
export const companies = pgTable(
  "companies",
  {
    // nanoid, not crypto.randomUUID() - this id appears in company profile URLs
    // (and jobs.companyId links to it), so it needs to actually look decent
    // there. 12 chars is still effectively collision-free at this table's
    // scale while being far shorter than a UUID.
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(12)),
    source: text("source").$type<"cleanjobdata" | "posted">().notNull().default("cleanjobdata"),
    /** CleanJobData's own employer id for this company, only when source="cleanjobdata" - null for locally-created companies. See this table's doc comment for why this isn't `id`. */
    externalId: text("externalId"),
    /** Set once a real employer is admin-verified and claims this (previously CleanJobData-ingested or newly "posted") company profile. Null means unclaimed. See this table's doc comment. */
    ownerId: text("ownerId").references(() => users.id, { onDelete: "set null" }),
    name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  websiteUrl: text("websiteUrl"),
  linkedinUrl: text("linkedinUrl"),
  twitterUrl: text("twitterUrl"),
  githubUrl: text("githubUrl"),
  youtubeUrl: text("youtubeUrl"),
  facebookUrl: text("facebookUrl"),
  instagramUrl: text("instagramUrl"),
  team: jsonb("team").$type<CompanyTeamMember[]>().notNull().default([]),
  employeeCount: text("employeeCount"),
  industry: text("industry"),
  headquarters: text("headquarters"),
  founded: integer("founded"),
  specialties: text("specialties").array().notNull().default([]),
  location: text("location"),
  registrableDomain: text("registrableDomain"),
  /** CleanJobData's own last_scraped_at for this employer - informational only (job-scraping cadence, not a profile-staleness signal - see refreshStaleCompanies()'s doc comment for why it's not used to decide refresh order). */
  sourceLastScrapedAt: timestamp("sourceLastScrapedAt", { mode: "date", withTimezone: true }),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Sync's upsert target (features/job-sync/lib/companies.ts) - also the
    // constraint that prevents duplicate syncs of the same CleanJobData
    // employer. See this table's doc comment for why NULL externalId
    // ("posted" companies) doesn't collide.
    uniqueIndex("companiesSourceExternalIdIdx").on(t.source, t.externalId),
  ]
);

/**
 * The single core jobs table - one row per job regardless of where it came
 * from, discriminated by `source`:
 * - "cleanjobdata": a local mirror of a CleanJobData API job LISTING (from
 *   the /jobs list endpoint - Job, not JobDetail; list items don't include
 *   `description`, only GET /jobs/:id does - job detail pages still call
 *   getJobById() live). `externalId` holds CleanJobData's own id for the
 *   row.
 * - "posted": a locally-posted job (job-posting feature). `externalId` is
 *   null - these jobs have no CleanJobData identity at all.
 *
 * `id` is an internally-generated UUID, NOT CleanJobData's id - decoupling
 * the two matters because applications.jobId (and any other future FK into
 * this table) needs one stable id space that's meaningful for both sources,
 * and because reusing an externally-owned id as our primary key would make
 * a future id-scheme change on CleanJobData's side (or an id collision
 * between the two sources) a breaking migration instead of a non-event.
 * Use `externalId` (scoped by `source`), never `id`, whenever matching
 * against anything that came back from the CleanJobData API (e.g. GET
 * /jobs/expired's ids - see lib/expire.ts).
 *
 * The unique index on (source, externalId) is what onConflictDoUpdate
 * targets during sync (features/job-sync/lib/sync.ts) - Postgres unique
 * indexes treat NULL as distinct from every other NULL, so any number of
 * source="posted" rows (externalId always null) coexist fine, while two
 * syncs of the same CleanJobData job (same source + externalId) correctly
 * upsert the same row instead of duplicating.
 *
 * Every scalar field on Job gets its own real column - nothing hides in an
 * opaque blob, so deleting a field a customer doesn't want is a normal
 * "drop the column, run a migration" step. The one exception is
 * `locations` - a job can have multiple locations (genuinely one-to-many),
 * so it stays JSONB with a GIN index, keeping containment queries (e.g.
 * filter by country_id) index-backed without needing a child table.
 * `company` is a real foreign key into companies (see that table's doc
 * comment for why this is a hard reference, not a soft one).
 *
 * Two-layer expiration (see features/job-sync/README.md) - applies to
 * source="cleanjobdata" rows only:
 * 1. isActive - the real signal, flipped by lib/expire.ts's
 *    pollExpiredJobs() when GET /jobs/expired reports a job as gone.
 * 2. expiresAt - a backstop only, staleAfterDays (job-sync.config.ts) after
 *    the row's last successful sync. Deletes rows regardless of isActive,
 *    in case the expired-poll itself has been failing/skipped for a long
 *    time - belt-and-suspenders, not the primary expiration mechanism.
 *
 * `status` is moderation state for job-posting's admin-review flow (job
 * v1 is external-URL-only - no on-site apply/candidate review - but a
 * "posted" job still needs an admin to sign off before it's publicly
 * visible). Defaults to "approved", NOT "pending": every existing row and
 * every future source="cleanjobdata" sync is trusted content that has
 * never needed moderation, and this column didn't exist before this
 * migration - a default of "pending" would retroactively hide every
 * already-synced job the moment the column appeared. job-posting's own
 * insert path is what actually sets "pending" for source="posted" rows;
 * the column default just has to not break existing semantics, not encode
 * the posted-job default itself. listJobsFromCache() (lib/read.ts) filters
 * on `status = "approved"` unconditionally so a pending/rejected posted
 * job never appears in public search.
 *
 * `requiresVerification` is a per-job escape hatch for a future
 * "auto-publish trusted employers" toggle (e.g. a claimed/verified company
 * skipping the moderation queue) without needing a schema change when that
 * config actually gets built - unused by any code yet, just the column.
 */
export const jobs = pgTable(
  "jobs",
  {
    // nanoid, not crypto.randomUUID() - see companies.id's comment above,
    // same reasoning: this id shows up in /jobs/[id]-style URLs for
    // source="posted" jobs (source="cleanjobdata" jobs still route on
    // externalId, unaffected by this).
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid(12)),
    source: text("source").$type<"cleanjobdata" | "posted">().notNull().default("cleanjobdata"),
    /** CleanJobData's own id for this job, only when source="cleanjobdata" - null for locally-posted jobs. See this table's doc comment for why this isn't `id`. */
    externalId: text("externalId"),
    title: text("title").notNull(),
    companyId: text("companyId").references(() => companies.id, { onDelete: "set null" }),
    companyName: text("companyName"),
    locationText: text("locationText"),
    locations: jsonb("locations").$type<Location[]>().notNull().default([]),
    applicationUrl: text("applicationUrl"),
    language: text("language"),
    employmentType: text("employmentType"),
    hasRemote: boolean("hasRemote").notNull().default(false),
    isActive: boolean("isActive").notNull().default(true),
    sourceExpiredAt: timestamp("sourceExpiredAt", { mode: "date", withTimezone: true }),
    experienceLevel: text("experienceLevel"),
    experienceLevels: text("experienceLevels").array().notNull().default([]),
    salaryMin: integer("salaryMin"),
    salaryMax: integer("salaryMax"),
    salaryCurrency: text("salaryCurrency"),
    salaryText: text("salaryText"),
    published: timestamp("published", { mode: "date", withTimezone: true }).notNull(),
    syncedAt: timestamp("syncedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expiresAt", { mode: "date", withTimezone: true }).notNull(),
    status: text("status").$type<"pending" | "approved" | "rejected">().notNull().default("approved"),
    requiresVerification: boolean("requiresVerification").notNull().default(false),
  },
  (t) => [
    // Default sort order for listJobsFromCache() and its keyset pagination cursor.
    index("jobsPublishedIdx").on(t.published),
    index("jobsExpiresAtIdx").on(t.expiresAt),
    index("jobsIsActiveIdx").on(t.isActive),
    index("jobsHasRemoteIdx").on(t.hasRemote),
    index("jobsCompanyNameIdx").on(t.companyName),
    // Postgres doesn't auto-index FK columns - listJobsFromCache()'s join needs this.
    index("jobsCompanyIdIdx").on(t.companyId),
    // Backs listJobsFromCache()'s unconditional status="approved" filter and
    // the phase 3 admin moderation queue's status="pending" lookup.
    index("jobsStatusIdx").on(t.status),
    // GIN for containment queries against the locations array, e.g.
    // locations @> '[{"country_id": 42}]' - stays index-backed without a
    // separate job_locations child table.
    index("jobsLocationsGinIdx").using("gin", t.locations),
    // Sync's upsert target (features/job-sync/lib/sync.ts) - also the
    // constraint that prevents duplicate syncs of the same CleanJobData
    // job. See this table's doc comment for why NULL externalId (posted
    // jobs) doesn't collide.
    uniqueIndex("jobsSourceExternalIdIdx").on(t.source, t.externalId),
  ]
);

/**
 * One row per sync attempt, split by `kind` - the incremental (new-jobs)
 * pass, the expired-check pass, and the company-refresh pass all run on
 * independent cadences (job-sync.config.ts's incrementalSyncIntervalHours/
 * expiredCheckIntervalHours/companyRefreshIntervalHours). The route
 * self-throttles each kind by looking up its own most recent successful
 * row here.
 */
export const syncRuns = pgTable(
  "syncRuns",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    kind: text("kind").$type<"incremental" | "expired_check" | "company_refresh">().notNull(),
    startedAt: timestamp("startedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finishedAt", { mode: "date", withTimezone: true }),
    status: text("status").$type<"running" | "success" | "error">().notNull().default("running"),
    /** For kind="incremental": the newest `published` timestamp seen this run - next run's watermark to stop at. */
    watermark: timestamp("watermark", { mode: "date", withTimezone: true }),
    jobsUpserted: integer("jobsUpserted").notNull().default(0),
    jobsExpired: integer("jobsExpired").notNull().default(0),
    errorMessage: text("errorMessage"),
  },
  (t) => [index("syncRunsKindStartedAtIdx").on(t.kind, t.startedAt)]
);
