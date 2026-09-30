# job-alerts

Emails a user new jobs matching their saved search preferences, on a
daily or weekly cadence they choose.

## Config (`features.config.ts` -> `jobAlerts`)

- `enabled` - the only flag. No `guestAccess`: an alert is emailed to a
  specific account, so there's no meaningful signed-out mode.

## Env vars

- `RESEND_API_KEY` / `EMAIL_FROM` - required to actually send. Same
  mailer as `auth`'s email verification - see `lib/email/mailer.ts` and
  `features/auth/README.md`'s "Email verification" section for the
  provider-swap seam.
- `CRON_SECRET` - the send job runs via `POST /api/cron` like `job-sync`'s
  tasks - see `docs/CRON.md`.

## How it decides who to email

Reuses `userPreferences` (`features/auth/db/schema.ts`) as the match
criteria - deliberately not a second copy of the same filter fields, so
"what you see on `/jobs`" and "what you get emailed" can never drift
apart. `jobAlerts.watermark` tracks the last instant a user's digest
covered, so each send only includes jobs published since then (never a
repeat, never the entire back catalogue on first enable).

## Sending is rate-limited on purpose

`lib/send.ts`'s `DEFAULTS` (`maxEmailsPerRun: 50`, `delayBetweenSendsMs:
250`) cap and pace every cron run - blasting every due alert at once is a
deliverability problem (the exact burst pattern spam filters penalise),
not a performance one. Alerts are processed oldest-`lastSentAt`-first, so
capping a run doesn't starve anyone - whoever gets cut off is first in
line next run. These live in the `alertSettings` table (adjustable live
at `/admin/alerts`, if `admin` is enabled), not a checked-in config file,
specifically so an operator can pause sending or drop the batch size
mid-incident without a code deploy.

## Routes

- `/preferences` (`routes/preferences/page.tsx`) - where a user turns
  alerts on/off and sets frequency. The page itself lives in this
  feature, but its main content is `onboarding`'s
  `PreferencesEditor` component (`features/onboarding/components/
  PreferencesEditor.tsx`), reused rather than forked so the same job-
  filter UI is used both right after sign-up and here - see
  `features/onboarding/README.md`. That's a real dependency on
  `onboarding` being present; account for it before removing either
  feature. Not in the header nav; reached from the user menu or a digest
  email's footer.

## DB

- `jobAlerts` - one row per user (userId is the PK): `enabled`,
  `frequency`, `watermark`, `lastSentAt`.
- `alertSettings` - single global row (`id: "global"`), the runtime
  sending controls above.

## Deleting this feature

Remove `app/(dashboard)/preferences/`, this folder, the `jobAlerts` entry
from `features.schema.ts`/`features.config.ts`, and the `export * from
"@/features/job-alerts/db/schema"` line in `lib/db/schema.ts`. The cron
task disappears on its own once `features/registry.ts`'s
`jobAlertsFeature` entry is removed. `onboarding` keeps working fine
without this feature - it's the other direction (this depends on
`onboarding`'s `PreferencesEditor`) that matters.
