# onboarding

A single-step "Job Seeker / Employer / Skip" flow shown once, right after
sign-up, that saves an account type and initial job-search preferences.

## Config (`features.config.ts` -> `onboarding`)

- `enabled` - the only flag. No `guestAccess`: this only ever runs for
  the account that was just created, immediately after sign-up - there's
  no guest-accessible version of it. Route-level gate is a direct
  `featuresConfig.onboarding.enabled` check in `routes/onboarding/
  page.tsx` (`notFound()` if off) rather than going through
  `features/registry.ts` - this feature has no nav item, provider, or
  cron task to register, so a full `FeaturePlugin` entry would be pure
  boilerplate.

## Env vars

None of its own - just `DATABASE_URL` (writes `users.accountType` and
`userPreferences`, both owned by `auth`).

## Routes

- `/onboarding` (`routes/onboarding/page.tsx`) - session-gated
  (`redirect("/sign-in")` if signed out). Sign-up itself signs the new
  account in first (`features/auth/actions/register.ts`), which is what
  makes a real session-gated route possible here instead of a step baked
  into the sign-up card.

## Shared with job-alerts

`components/PreferenceFields.tsx` and `components/PreferencesEditor.tsx`
are the actual job-filter form (locations, remote, seniority, etc.),
built once and reused by `job-alerts`' `/preferences` page - not forked,
so the same UI/validation is used both right after sign-up and whenever
someone comes back to edit their filters later. See
`features/job-alerts/README.md`. If you remove this feature, check
`job-alerts` isn't still importing from it first.

## Data model

No new tables - writes to `users.accountType` and `userPreferences`
(both `features/auth/db/schema.ts`), the same rows the job listing/
job-alerts features already read.

## Deliberately simple v1

One inline three-way choice, not a multi-step wizard or its own gated
sub-flow. If onboarding ever needs more than this one step, it's meant to
grow into that then - not pre-built for a scenario that doesn't exist yet
(see `features.schema.ts`'s `onboarding` entry for the fuller reasoning).

## Deleting this feature

Remove `app/(dashboard)/onboarding/`, this folder (after checking
`job-alerts` doesn't still import `PreferenceFields`/`PreferencesEditor`
from it - fork them into `job-alerts` first if you're keeping that
feature), and the `onboarding` entry from
`features.schema.ts`/`features.config.ts`. No `features/registry.ts`
entry to remove - it was never registered there.
