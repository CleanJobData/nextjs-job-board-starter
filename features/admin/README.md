# admin

A moderation/ops dashboard for job postings, job-alert send settings, sync
status, and user roles. No new tables - reads and acts on data other
features already own.

## Config (`features.config.ts` -> `admin`)

- `enabled` - the only flag. No `guestAccess`: admin access isn't a
  per-visitor guest/auth split, it's a per-user `role` check
  (`features/authGuard.ts`'s `requireAdmin()`, which reads `users.role`
  straight from the DB). `enabled: false` hides the whole `/admin` route
  group behind `notFound()` even for an actual admin.

## Env vars

None of its own - just whatever the features it manages already need
(`DATABASE_URL` always; `RESEND_API_KEY`/`EMAIL_FROM` if you'll use
`/admin/alerts`' send-settings; nothing extra for postings/sync/users).

## Getting an admin account

There's no self-serve "promote to admin" UI. Sign up normally, then:

```
npm run promote-admin -- you@example.com
```

(`scripts/promote-admin.ts`, backed by `users.role` - see
`features/auth/README.md`'s "Admin role" section.)

## Routes

- `/admin` - landing page linking to the three sections below.
- `/admin/postings` - moderation queue for `job-posting`'s self-service
  postings. `approvePosting()`/`rejectPosting()` (`actions/postings.ts`)
  flip `jobs.status` between `pending`/`approved`/`rejected`; a rejection
  can carry a reason, surfaced back to the poster.
- `/admin/alerts` - tunes `job-alerts`' sending behavior at runtime
  (pause sending, `maxEmailsPerRun`, `delayBetweenSendsMs`,
  `maxJobsPerDigest` - see `features/job-alerts/README.md`), rather than
  requiring a redeploy to change those constants.
- `/admin/sync` - read-only status of `job-sync`'s ingestion pipeline
  (last run, counts) - nothing here triggers a sync manually; that's
  `/api/cron`, see `docs/CRON.md`.
- `/admin/users` - list users, change role (`user`/`admin`). Self-
  demotion is blocked both in the UI (disabled control) and server-side.

Every route/action here calls `requireAdmin()`, not `checkAccess()` -
that's the auth feature's feature-flag/guest-access check, this is a
role check, and the two are deliberately not conflated.

No nav link is rendered anywhere for `/admin` (even to admins) - the app
shell (`SiteHeader.tsx`) has no per-session read today, so there's no way
to show a link only to admins without changing that component's shape.
v1 tradeoff: navigate to `/admin` directly or bookmark it.

## Deleting this feature

Remove `app/(admin)/`, this folder, the `admin` entry from
`features.schema.ts`/`features.config.ts`, and the `adminFeature`
import/entry in `features/registry.ts`. The features it manages
(`job-posting`, `job-alerts`, `job-sync`) keep working without it - their
own defaults/DB state just become unreachable to change at runtime.
