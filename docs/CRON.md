# Setting up scheduled tasks (cron)

This app has **one** cron endpoint: `POST /api/cron`. It's app-wide, not
tied to any single feature - it runs every scheduled task any enabled
feature has registered (today, that's job-sync's three sync phases; a
future feature like job alerts or email digests would add its own tasks
here too, with no new endpoint needed).

The endpoint itself has no built-in scheduling - **something external has
to call it**. It's secret-header-authenticated and safe to call as often
as you like; each registered task self-throttles on its own cadence and
just no-ops if it isn't due yet.

**A cron workflow is NOT included in this template.** It was removed because a pre-wired workflow would run against this repo's GitHub Actions on every fork — failing immediately since `APP_URL` and `CRON_SECRET` secrets don't exist yet. Instead, copy one of the options below into your own repo once you've deployed.

## 1. Set `CRON_SECRET`

Add a random secret to your `.env`/hosting provider's environment
variables:

```
CRON_SECRET=<a long random string>
```

Generate one with `openssl rand -hex 32` or similar. Every call to
`/api/cron` must send this as `Authorization: Bearer <value>` or it gets
a 401.

## 2. Pick a scheduler

### GitHub Actions (recommended)

Create `.github/workflows/cron.yml` in your repo:

```yaml
name: Scheduled sync

on:
  schedule:
    - cron: "0 * * * *"   # every hour — match your job-sync.config.ts interval
  workflow_dispatch:       # lets you trigger manually from the Actions tab

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Call /api/cron
        run: |
          curl -sf -X POST "${{ secrets.APP_URL }}/api/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Then add two secrets in your GitHub repo's **Settings → Secrets → Actions**:
- `APP_URL` → your deployed site URL (e.g. `https://yourboard.com`)
- `CRON_SECRET` → same value as in your deployment's env vars

### Vercel Cron

Only relevant if you're actually deployed on Vercel, and only if you'd
rather not use the shipped GitHub Actions workflow. Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "0 * * * *" }
  ]
}
```

Keep this schedule matched to `job-sync.config.ts` by hand if you use
this option - `npm run cron:sync` only generates the GitHub Actions
workflow today, not `vercel.json` (open an issue/PR if you want that
added). Note Vercel's free/Hobby plan limits Cron Jobs to once a day,
which is too infrequent to catch an hourly `incrementalSyncIntervalHours`
- this option needs a paid plan for the default config. Also, Vercel
Cron sends its own trigger, not your `CRON_SECRET` header, by default -
either configure a [custom header via Vercel's cron
protection](https://vercel.com/docs/cron-jobs/security) matching what
this route expects, or adjust the route to also accept Vercel's
`x-vercel-cron-signature` verification if you go this route. The plain
`Authorization: Bearer` check as shipped assumes you're calling it
yourself (GitHub Actions, crontab) rather than relying on Vercel's own
cron auth - adapt as needed if you pick this option.

### Self-hosted crontab

If you're running the app on your own always-on server, mirror
`job-sync.config.ts`'s fastest interval yourself (same caveat as Vercel
Cron above - this isn't generated):

```
0 * * * * curl -sf -X POST https://yourapp.com/api/cron -H "Authorization: Bearer $CRON_SECRET"
```

### `node-cron` (self-hosted only, not the shipped default)

An in-process alternative to an external scheduler entirely - only
viable if you're self-hosting on an always-on Node process (it does
nothing on serverless platforms, since there's no persistent process to
hold its timer). Not included by default since this template has to
work on both serverless and self-hosted deployments. If you're self-
hosting and want to remove the scheduler-file question entirely, this is
how: call `runIncrementalSync()` etc. directly, in-process, reading
`job-sync.config.ts`'s intervals straight from code with no YAML/cron
expression involved at all.

## 3. Verify it's working

```
curl -X POST https://yourapp.com/api/cron -H "Authorization: Bearer $CRON_SECRET"
```

A healthy response looks like:

```json
{
  "ok": true,
  "job-sync:incremental": { "ran": true, "jobsUpserted": 12 },
  "job-sync:expired-check": { "ran": false, "reason": "not due yet" },
  "job-sync:company-refresh": { "ran": false, "reason": "not due yet" }
}
```

`ok: false` and a 500 status mean at least one task actually failed (not
just "not due yet") - check that task's `error` field, and the `syncRuns`
table (job-sync's tasks log every attempt there) for more detail.
