# job-sync

Mirrors CleanJobData job **listings** into a local `cachedJobs` table, so
listing reads can hit Postgres instead of the live API on every request.
Purely a data-layer feature - no routes, no nav items of its own; it
registers three scheduled tasks (below) that the app-wide
`app/api/cron/route.ts` dispatcher runs.

## Config

- `features.config.ts` -> `jobSync`: only `enabled`/`guestAccess` (the
  cross-cutting flags every feature has).
- `features/job-sync/job-sync.config.ts`: everything about *how* this
  feature syncs - cadence, page size, expiry tuning. Kept separate from
  the root config since these are implementation details of one feature,
  not something that belongs in the shared file.

## Three independent phases, registered as cron tasks

`features/job-sync/feature.ts` registers all three as `cronTasks` (see
`lib/cron/types.ts`), picked up by the single app-wide
`POST /api/cron` dispatcher (`app/api/cron/route.ts`) - not a job-sync-
specific route. Each is self-throttled by its own cadence
(`syncRuns.kind` tracks them separately) - safe to call the shared route
as often as you like from any scheduler; it no-ops whatever isn't due yet.
See the root `docs/CRON.md` for how to wire up an actual scheduler.

1. **Incremental sync** (`incrementalSyncIntervalHours`, default hourly) -
   `sort_by=published`, fetches only jobs newer than the last successful
   run's watermark, stops as soon as it reaches an already-seen job. Cheap:
   a handful of requests per run in steady state, not a full re-list. Any
   employer id seen for the first time also triggers an immediate
   `GET /companies/:id` fetch (see "Company data" below).
2. **Expired check** (`expiredCheckIntervalHours`, default daily) - polls
   `GET /jobs/expired?max_age=<expiredCheckWindowHours>` and flips
   `isActive=false` on any matching cached row, then runs the
   `staleAfterDays` backstop delete. This is the only way to detect
   removals - the incremental pass structurally can't see them, since the
   backend's default `/jobs` response already excludes inactive jobs
   before we ever see it.
3. **Company refresh** (`companyRefreshIntervalHours`, default weekly) -
   see "Company data" below.

### Why two layers of expiration

- **Real signal**: `isActive`, flipped by the expired-check phase against
  `GET /jobs/expired` - CleanJobData's own source of truth for "this job
  is gone."
- **Backstop**: `expiresAt` (`staleAfterDays`, default 60) - a hard delete
  regardless of `isActive`, in case the expired-check phase fails or gets
  skipped for an extended period. Belt-and-suspenders, not the primary
  mechanism. `listJobsFromCache()` filters on both, not just `isActive`,
  so a row past its backstop doesn't render even before the next prune.

## Triggering a sync

`POST /api/cron` (the shared app-wide cron dispatcher, not a job-sync-
specific path) with header `Authorization: Bearer $CRON_SECRET` - see
`docs/CRON.md` for the actual scheduler setup. No platform assumptions -
Vercel Cron, a GitHub Actions scheduled
workflow, or a plain `curl` from crontab all work identically (GitHub
Actions is the recommended default here specifically because it works the
same regardless of where you deploy the app itself, unlike Vercel Cron).
Since the route self-throttles internally, you can safely point a
scheduler at it more often than your configured cadence (e.g. every 15
min) without wasting API calls - it'll just skip until a phase is
actually due.

**Why not an in-process scheduler (e.g. `node-cron`)?** That requires the
Node process to stay alive continuously to hold its timer - works fine
for a self-hosted always-on server, but does nothing (or errors) on
serverless platforms like Vercel, where each request gets its own
on-demand invocation with no persistent process to host a timer in. Since
this template has to work on both, the trigger is external and the route
itself has no built-in scheduling - `node-cron` is a reasonable choice
*if* you're self-hosting on an always-on server and want one less moving
part than an external scheduler, but it can't be the shipped default.

**Phase isolation**: the three phases run strictly sequentially, never in
parallel - all three ultimately hit the CleanJobData API, and running
them concurrently would multiply the request burst against its rate
limits for no benefit. Each phase's own function catches its own errors
and logs them to `syncRuns` before re-throwing (so the row always
reflects what happened); `syncJobs()` wraps each phase call individually
(`runPhase()`) so one phase failing doesn't prevent the next ones from
getting their turn in the same invocation - verified by forcing an error
in the incremental phase and confirming the other two still ran their own
due-checks normally. The route's HTTP status reflects this too: `ok:
false` / `500` if *any* phase reports a real error, not just whichever
phases happened to also be "not due yet" (which isn't a failure).

## Tuning to your CleanJobData plan tier

`pageLimit` and `incrementalSyncIntervalHours` default to conservative
values (20/hour) since we don't know your tier. Raise `pageLimit` to match
your plan's `max_list_limit` (20 for trial/free, 100 for STARTER/PRO/
ENTERPRISE) for fewer requests per sync. Note `GET /jobs/expired` shares
the same monthly quota as `/jobs` list calls on most tiers - factor that
in before tightening `expiredCheckIntervalHours`.

## Sync-time filters - which jobs get pulled in at all

`job-sync.config.ts`'s `syncFilters` controls which jobs from CleanJobData's
full catalog land in this deployment's database in the first place - set
once by the site owner, config-driven (a future picker UI would generate
this same file, not a different mechanism). Empty object = sync
everything.

**Full coverage of every public `GET /jobs` filter param** (audited
directly against `jobsDataAPI-backend`'s `normalizeJobListQuery.js` - no
internal-only param used anywhere here), one canonical name per concept,
no aliases exposed even where the backend accepts several:

| `syncFilters` field | backend param sent | notes |
|---|---|---|
| `title` | `title` | free text |
| `location` | `location` | **2-letter ISO country codes only** (e.g. `"US"`) - NOT free text/country names. Backend silently drops non-matching values rather than erroring; `job-sync.schema.ts` validates the format itself at config-parse time so a typo fails loudly instead. |
| `cityId`/`stateId`/`countryId` | `city_id`/`state_id`/`country_id` | CleanJobData's own numeric ids, not human-guessable - only use if already known/looked up |
| `remoteOnly` | `remote_only` (not the `workSetting`/`remote`/`has_remote` aliases) | |
| `remoteType` | `remote_type` | one of `fully_remote`/`remote_country`/`remote_region`/`hybrid`, independent of `remoteOnly` |
| `experienceLevel` | `experience_level` | |
| `employmentType` | `employment_type` | exact backend allowlist (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`, `TEMPORARY`, `FREELANCE`, `APPRENTICESHIP`, `VOLUNTEER`, `PER_DIEM`, `OTHER`) - anything else 400s server-side |
| `minSalary`/`maxSalary` | combined `salary=min,max` | the backend has no standalone `max_salary` param - only the combined form works |
| `requireSalary` | `require_salary` | only takes effect when `minSalary` is also set |
| `companyName` | `company_name` | free text |
| `companyWebsiteUrl` | `company_website_url` | free text substring match against the company's actual website - verified against real data |
| `sourceDomain` | `domain` | **not** a company filter despite the backend's param name - matches the job's internal source/ATS-board domain. Verified against real data: filtering by a real company's website domain here returns zero results, confirming it's a different, niche/technical field. |
| `employerId` | `employer_id` | CleanJobData's own employer id (same value `features/job-sync/lib/companies.ts` uses) - restricts sync to specific known employers |
| `createdMaxAge` | `created_max_age` | duration string (e.g. `"30d"`) - filters on creation time, distinct from `publishedAfter`/`max_age` which filter on `published` |
| `includeRemoteWithoutCountry` | `includeRemoteWithoutCountry` | includes remote jobs with no resolved country, which a location filter would otherwise exclude |

Every one of the params above was tested with a real request against the
live API during development (not just type-checked) to confirm it behaves
as documented.

This is entirely separate from **end-user filters** (`JobFilters.tsx`,
what a customer's own site visitors can narrow down among whatever's
already synced) - a sync filter decides what enters the database, an
end-user filter decides what's shown from it.

## Schema - no more single `data` blob

Every scalar field on `Job` has its own real typed column on `cachedJobs`
now - nothing hides in an opaque blob, so removing a field a customer
doesn't want is a normal "drop the column, run a migration" step. Two
exceptions, both genuinely one-to-many arrays-of-objects that would need
real child tables to fully relationally normalize:

- **`locations: jsonb`** (GIN-indexed) - a job's full `Location[]` array,
  not just a "primary" one. `listJobsFromCache()` filters `city_id`/
  `state_id`/`country_id` via JSONB containment queries (e.g.
  `locations @> '[{"country_id": 42}]'`), index-backed via
  `cachedJobsLocationsGinIdx`. Verified against real data: Postgres
  picks a seq scan over the GIN index at small table sizes (expected/
  correct at low row counts - confirmed the index is real and usable via
  `SET enable_seqscan = off`), and will use it automatically as the table
  grows.
- **`companies`** - a separate table, with a **real, enforced foreign key**
  (`cachedJobs.companyId` → `companies.id`, `ON DELETE SET NULL`) - not a
  soft reference. `companies.id` is CleanJobData's own stable employer id
  (see "Company data" below), not a guessed/computed key, so this is a
  real relation, not an approximation. Company info is **upserted**, not
  duplicated per job row - a company posting 200 jobs gets one `companies`
  row, updated in place when refreshed, instead of 200 copies.
  `company.team[]` stays JSONB inside that row (still array-of-objects,
  same reasoning as `locations`). `listJobsFromCache()` left-joins
  `companies` (not inner - `companyId` is nullable, a job can have no
  company) to reassemble the full `Job.company` object per result.
  Verified against real data: 0 orphaned `companyId` references after a
  real sync, confirming the FK is actually enforcing integrity.

## Company data - fetched separately, not trusted from the job embed

Every job response embeds a `company` object, but that's a partial,
job-response-shaped snapshot - not the canonical record. `companies` is
populated from CleanJobData's actual company API instead
(`lib/api/companies.ts`, consumed by `features/job-sync/lib/companies.ts`):

- **`GET /companies/:id`** - the only endpoint with the full enrichment
  payload (socials, industry, team, description, etc). Called once per
  employer the first time we see their `employer_id` on a job (during the
  incremental pass, before that page's jobs get upserted, so
  `cachedJobs.companyId`'s FK always has a row to point at).
- **Company refresh is a bounded rotation, not staleness detection.**
  There's no reliable way to cheaply tell "did this company's profile
  change": CleanJobData never exposes `website_enrichment_at`/
  `linkedin_enriched_at` (the fields that would actually mean that) on
  any `/companies` response, only `last_scraped_at` (job-scraping
  cadence, ~12h per employer - unrelated to profile changes), and the
  batch/list endpoint (`GET /companies?employer_id=...`) never returns
  enrichment data anyway, regardless of filtering. An earlier version of
  this design used `last_scraped_at` as a staleness proxy via that batch
  endpoint - wrong, since it would flag nearly every actively-scraped
  company as "stale" on every run (job scraping happens far more often
  than our weekly cadence), making the "cheap check" pointless. Instead,
  `refreshStaleCompanies()` orders known companies by our own
  `updatedAt` (oldest-refreshed-first) and re-fetches the oldest
  `companyRefreshBatchSize` via `GET /companies/:id` directly each run -
  an honest bounded cost (exactly N detail calls per run) instead of
  fake precision. Verified against real data: forced one company to be
  the oldest-updated, ran the phase, confirmed exactly that company (and
  only that one) got refreshed and dropped out of the "oldest" ordering.

**`employer_id` field name note**: real (public-tier) CleanJobData API
keys get this field as `employer_id` on a job. This template's own local
`.env` happens to use an internal-tier key, which returns the same value
as `ats_employer_id` instead - `getEmployerId()` in
`features/job-sync/lib/companies.ts` checks both purely so this
template's own dev/test environment can exercise the company-sync code
path; real customer deployments will only ever have `employer_id`.

## Timezones

Every timestamp column is `timestamptz` (`withTimezone: true`), not
Drizzle's default bare `timestamp`. Timestamps get written through two
different paths - app-side `new Date()` (e.g. `expiresAt`, watermark
comparisons) and DB-side `defaultNow()` - and a bare `timestamp` column
just stores a naive number with no zone attached, which only stays
consistent if every write agrees on the same timezone. That held by
accident locally (this Postgres session defaults to `TimeZone=UTC`), but
isn't guaranteed on every customer's Postgres host, and a mismatch would
silently corrupt exactly the comparisons this feature depends on.
`timestamptz` stores an absolute instant regardless of session timezone,
removing the ambiguity entirely. Verified: `published` reads back as
`2026-08-21 03:32:22.853+00` - a real UTC offset, not an ambiguous naive
value.

## Known limitations

- **`ListQuery.location` means different things depending on the branch.**
  On the live API (`lib/api/jobs.ts`'s `listJobs()`, including sync-time
  filters), it's strictly 2-letter ISO country codes - see the
  `syncFilters` note above. On the cache branch (`listJobsFromCache()`'s
  end-user filtering), it's a loose free-text `ILIKE` match against
  `locationText`, a deliberately different, made-up-on-our-side semantic
  (not derived from the live API's actual rules). Same field name, two
  genuinely different behaviors depending on which branch is active -
  worth knowing if you're ever debugging why a location filter behaves
  differently between `jobSync.enabled: true` and `false`.
- Only job **listings** are cached, not full detail pages (list items don't
  include `description` - that's only on `GET /jobs/:id`, which
  `app/jobs/[id]/page.tsx` still calls live).
- Pagination cursor for the cached listing is our own opaque keyset format
  (`published`+`id`), unrelated to the live API's cursor - safe since a
  deployment only ever exercises one branch at a time.
- `GET /jobs/expired`'s `max_age` is a relative window, not an absolute
  timestamp - `expiredCheckWindowHours` should stay >=
  `expiredCheckIntervalHours` plus a safety margin, or a late/skipped run
  could miss expirations that happened in the gap.
- A new employer id triggers a synchronous `GET /companies/:id` call
  during the incremental pass - a page with many never-seen-before
  companies takes longer than one with all-known companies. Not currently
  batched/parallelized (sequential, one request per new employer).
- Changing `syncFilters` after jobs have already been synced under a wider
  (or different) filter doesn't retroactively remove what no longer
  matches, and the incremental pass's watermark can cause it to skip older
  jobs that would now match a newly-loosened filter - a filter change is
  best paired with clearing `cachedJobs`/`companies` and the `incremental`
  rows in `syncRuns` for a clean backfill.

## DB tables

`companies` (one row per employer, soft-keyed, upserted), `cachedJobs`
(flat typed columns for everything scalar + `locations` JSONB), `syncRuns`
(one row per sync attempt, split by `kind`, for debugging and
self-throttle watermarking).

## Deleting this feature

Remove this folder (including its `cronTasks` registration - the shared
`app/api/cron/route.ts` dispatcher stays, it just has nothing of this
feature's left to run), the `jobSync` entry from
`features.schema.ts`/`features.config.ts`, the `jobSyncFeature`
import/entry in `features/registry.ts`, the
`export * from "@/features/job-sync/db/schema"` line in `lib/db/schema.ts`,
the cache-branch import in `lib/jobs/getJobs.ts`, and `getExpiredJobs`/
`ExpiredJobsResponse`/`ExpiredJobItem` from `lib/api/jobs.ts`/`types.ts` if
nothing else uses them.
