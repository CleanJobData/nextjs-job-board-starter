# job-posting

Lets an authenticated employer create a company profile and post jobs
directly, without going through the CleanJobData sync pipeline. v1 scope is
deliberately narrow - see "Known limitations" below.

## Enabling

`features.config.ts`:

```ts
jobPosting: { enabled: true, guestAccess: false },
```

`guestAccess` is hard-typed `false` in `features.schema.ts` - posting a job
inherently requires an account, same as `applications`.

## Env vars

None of its own. It reuses `lib/storage/` for company logo uploads, so
whichever env vars that module needs already apply (see
`lib/storage/README.md`):

- `STORAGE_PROVIDER` (`local` default, or `s3`)
- If `s3`: `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
  optionally `S3_ENDPOINT` / `S3_PUBLIC_URL_BASE`.

## Data model

No new tables - reuses the existing `companies` and `jobs` tables
(`features/job-sync/db/schema.ts`), discriminated by `source: "posted"`.

- `jobs.description` was **added** in this phase (it didn't previously
  exist - synced jobs fetch description live from CleanJobData's
  `GET /jobs/:id`; posted jobs have no live API to fall back to, so they
  need somewhere to store it).
- `jobs.status` / `jobs.requiresVerification` (added in phase 1's
  foundation commit) are what this feature actually sets:
  `createJobPosting()` always inserts `status: "pending"`,
  `requiresVerification: true`. Only an admin (phase 3, not built yet) can
  ever flip `status` to `"approved"`/`"rejected"`.
- `jobs.expiresAt` stays `NOT NULL`; posted jobs get `now() + 90 days` at
  insert time (`POSTED_JOB_TTL_DAYS` in `actions/job-postings.ts`) rather
  than the column being made nullable - every existing consumer of
  `expiresAt` already assumes a real, comparable date.
- `jobs.sourceExpiredAt` / `syncedAt`: left null / default - both are
  cleanjobdata-sync-specific concepts (sync watermark, expired-poll
  timestamp) that don't apply to a posted job.
- `companies.ownerId` is set to the creating user's id at company-creation
  time. Claiming an existing (CleanJobData-ingested) company profile - i.e.
  setting `ownerId` on a `source: "cleanjobdata"` row - is **not** built
  here; it's admin-gated and left for phase 3.

## Public visibility

`features/job-sync/lib/read.ts`'s `listJobsFromCache()` was extended
(not forked) to serve a single unified feed: both `source="cleanjobdata"`
and `source="posted", status="approved"` rows, through the same keyset
pagination, filters, and homepage/search UI. A pending or rejected posting
is excluded by an unconditional `status = "approved"` filter, regardless of
source.

Job detail (`/jobs/[id]`) has its own read seam
(`jobs/lib/getJobs.ts`'s `getJobDetail()`): it checks
`features/job-sync/lib/read.ts`'s `getPostedJobById()` first (our own DB,
no live API call) and only falls through to the existing cache-or-live
CleanJobData path on a miss. This is how a posted job's nanoid id resolves
correctly instead of 404ing against the live API.

## Known limitations (v1)

- **External-URL applications only.** A posting just has `applicationUrl`
  (reusing the column synced jobs already use) - no on-site apply flow, no
  applicant submission storage, no employer-facing applicant review.
- **No claim-existing-company flow.** Only brand-new "posted" companies can
  be created here.
- **No admin moderation UI yet.** Every posting sits at `status: "pending"`
  until phase 3 builds the approve/reject dashboard. There is currently no
  way to move a posting to `"approved"` except manually, in the DB.
- A pending/rejected posting is still viewable at its direct `/jobs/[id]`
  link (by design, so a poster can preview/share their own pending
  posting) - it's just excluded from the public search feed. There's no
  extra access control on that direct link yet (e.g. restricting it to the
  owner) - a real gap, left for a future phase.
