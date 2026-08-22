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

Any of these work identically - the endpoint doesn't know or care which
one calls it.

### GitHub Actions (recommended default)

Works regardless of where the app itself is deployed - Vercel, a VPS,
anywhere. Add `.github/workflows/cron.yml`:

```yaml
name: Scheduled sync
on:
  schedule:
    - cron: "0 * * * *"   # every hour - adjust to your fastest registered task's interval
  workflow_dispatch:        # lets you trigger it manually from the Actions tab too

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Call /api/cron
        run: |
          curl -sf -X POST "${{ secrets.APP_URL }}/api/cron" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `APP_URL` (e.g. `https://yourapp.com`) and `CRON_SECRET` as repo
secrets (Settings -> Secrets and variables -> Actions). `-sf` makes curl
fail the workflow step (visible in the Actions tab) if the endpoint
returns a non-2xx status - which now genuinely reflects a real task
failure, not just "nothing was due yet."

### Vercel Cron

Only relevant if you're actually deployed on Vercel. Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "0 * * * *" }
  ]
}
```

Vercel Cron sends its own trigger, not your `CRON_SECRET` header, by
default - either configure a [custom header via Vercel's cron
protection](https://vercel.com/docs/cron-jobs/security) matching what
this route expects, or adjust the route to also accept Vercel's
`x-vercel-cron-signature` verification if you go this route. The plain
`Authorization: Bearer` check as shipped assumes you're calling it
yourself (GitHub Actions, crontab) rather than relying on Vercel's own
cron auth - adapt as needed if you pick this option.

### Self-hosted crontab

If you're running the app on your own always-on server:

```
0 * * * * curl -sf -X POST https://yourapp.com/api/cron -H "Authorization: Bearer $CRON_SECRET"
```

### `node-cron` (self-hosted only, not the shipped default)

An in-process alternative to an external scheduler - only viable if
you're self-hosting on an always-on Node process (it does nothing on
serverless platforms, since there's no persistent process to hold its
timer). Not included by default since this template has to work on both
serverless and self-hosted deployments, but if you're self-hosting and
want one less moving part than an external scheduler, you could add it
yourself and have it call the same `syncJobs`-equivalent logic directly
in-process rather than over HTTP.

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
