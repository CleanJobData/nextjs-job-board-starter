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

**`job-sync.config.ts` (`incrementalSyncIntervalHours` etc.) is the only
place actual sync/task frequency is controlled.** The scheduler below
exists purely to guarantee the endpoint gets pinged - it's set to a fixed
15-minute floor, deliberately much shorter than any real task interval,
so the app's own self-throttle is always what decides when work actually
happens. Don't try to "tune" the scheduler's cadence to match a task's
interval - that's exactly the trap that leads to two numbers (the
external schedule and the config) quietly drifting apart, with no clear
signal when they do. Change `job-sync.config.ts`, leave the scheduler
alone.

## 0. Already shipped: `.github/workflows/cron.yml`

This repo includes a working GitHub Actions workflow out of the box,
firing every 15 minutes. You only need to add the two secrets below for
it to start working - you should not need to edit the workflow file
itself.

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

`.github/workflows/cron.yml` (shipped, see step 0) is the default and
the recommended path for most deployments - you likely don't need
anything below this. The alternatives exist for cases GitHub Actions
doesn't fit (no GitHub repo, want everything on one platform, etc). All
of them work identically from the endpoint's point of view; whichever
one you pick, set it to a fixed, frequent interval (5-15 minutes) and
leave it alone - see the note in section 1 above. None of these need
tuning to "your" cadence; `job-sync.config.ts` is the only file that
does.

### Vercel Cron

Only relevant if you're actually deployed on Vercel, and only if you'd
rather not use the shipped GitHub Actions workflow. Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron", "schedule": "*/15 * * * *" }
  ]
}
```

Note Vercel's free/Hobby plan limits Cron Jobs to once a day, which is
too infrequent for this floor-trigger approach to work as intended -
this option needs a paid plan. Also, Vercel Cron sends its own trigger,
not your `CRON_SECRET` header, by default - either configure a [custom
header via Vercel's cron protection](https://vercel.com/docs/cron-jobs/security)
matching what this route expects, or adjust the route to also accept
Vercel's `x-vercel-cron-signature` verification if you go this route.
The plain `Authorization: Bearer` check as shipped assumes you're
calling it yourself (GitHub Actions, crontab) rather than relying on
Vercel's own cron auth - adapt as needed if you pick this option.

### Self-hosted crontab

If you're running the app on your own always-on server:

```
*/15 * * * * curl -sf -X POST https://yourapp.com/api/cron -H "Authorization: Bearer $CRON_SECRET"
```

### `node-cron` (self-hosted only, not the shipped default)

An in-process alternative to an external scheduler - only viable if
you're self-hosting on an always-on Node process (it does nothing on
serverless platforms, since there's no persistent process to hold its
timer). Not included by default since this template has to work on both
serverless and self-hosted deployments, but if you're self-hosting and
want one less moving part than an external scheduler, you could add it
yourself and have it call the same `syncJobs`-equivalent logic directly
in-process rather than over HTTP. Note this doesn't actually need the
"frequent floor" pattern the HTTP-based options above use - since it's
your own code, you could call `runIncrementalSync()` etc. directly on
`job-sync.config.ts`'s real interval instead of polling - but then
you're back to one config, not zero, and you've traded "one file to
edit" for "no external scheduler," which is a different tradeoff than
this doc's default assumes.

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
