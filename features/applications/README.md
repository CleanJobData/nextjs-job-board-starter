# applications

A personal application tracker for signed-in job seekers - not a "submit
to employer" flow. Most synced jobs already have their own external
`application_url`; this just lets a user keep a private list of jobs
they've saved/applied to, with a status (`saved` → `applied` →
`interviewing` → `offer`/`rejected`/`withdrawn`).

## Config

`features.config.ts` → `applications`: `enabled` and `guestAccess`
(hard-locked to `false` in `features.schema.ts` - this feature inherently
requires an account). No feature-local config file - nothing here needs tuning.

## Why no foreign key to job-sync's `cachedJobs`

The original plan assumed applications would reference `cachedJobs`
directly. That's wrong for two reasons:

1. `job-sync` is optional - a deployment without it enabled has no
   `cachedJobs` rows at all, and this feature has to work regardless.
2. Even with job-sync enabled, `cachedJobs` rows aren't permanent - they
   get pruned on TTL expiry (`features/job-sync/lib/expire.ts`). A hard FK
   there would mean a user's application history silently breaks the
   moment the cache entry it pointed to expired.

Instead, `applications` stores a self-sufficient snapshot
(`jobId`/`jobTitle`/`companyName`/`jobUrl`, captured at the moment the
user tracks the job) - no dependency on job-sync at all, and the record
stays meaningful forever.

## Routes

- `/applications` - the dashboard (list, change status, remove). Shimmed
  in `app/(dashboard)/applications/page.tsx` with the three-way
  `checkAccess()` guard (disabled → 404, no session → redirect to
  `/sign-in`, otherwise render) - verified with a real request that an
  unauthenticated visitor gets redirected correctly.
- A "Track this job" button on the full job detail page
  (`app/jobs/[id]/page.tsx`), via the `jobDetailActions` registry slot
  (see below). **Not yet wired into the modal/intercepted job view**
  (`jobs/components/JobSideView.tsx`) - that component receives an
  unresolved job promise for a fast-open UX, so it can't synchronously
  construct the action server-side without a larger restructure. Scoped
  limitation, not an oversight.

## The `jobDetailActions` registry slot

`jobs/components/JobDetailView.tsx` is a client component and must never
import `features/registry.ts` directly - doing so once pulled the `pg`
Postgres driver into the browser bundle (confirmed by a real build
failure: "Module not found: Can't resolve 'util/types'", since
`registry.ts` also carries job-sync's `cronTasks` registration, which
transitively imports `lib/db/client.ts`). Instead, `app/jobs/[id]/page.tsx`
(a server component) imports `activeJobDetailActions` from the registry,
constructs the actual React nodes there, and passes them down as
`JobDetailView`'s `extraActions` prop - the client component never touches
the registry module at all. `features/registry.ts`'s `FeaturePlugin`
interface gained `jobDetailActions?: () => ComponentType<{ job: Job }>[]`
for this - the same pattern as `navItems`/`providers`/`cronTasks`.

`features/applications/components/JobDetailTrackAction.tsx` is the
adapter registered there, mapping a full `Job` onto
`TrackApplicationButton`'s minimal input shape.

## Guest handling

The button itself checks `useSession()` client-side and renders a
"Sign in to track this job" link instead of a non-functional button for
signed-out visitors - `trackApplication()` would reject them server-side
anyway (`guestAccess` is hard-locked false), so this avoids a button that
silently fails on click. Verified with a real request: the job detail
page renders "Sign in to track" (not the tracking button) when signed out.

## DB table

`applications` - one row per (user, job) pair, enforced by a unique
index on `(userId, jobId)` (re-tracking the same job upserts instead of
duplicating - verified against real data), cascade-deletes when the
owning user is deleted.

## Deleting this feature

Remove this folder, the `applications` entry from
`features.schema.ts`/`features.config.ts`, the `applicationsFeature`
import/entry in `features/registry.ts`, the
`export * from "@/features/applications/db/schema"` line in
`lib/db/schema.ts`, and `app/(dashboard)/applications/`.
