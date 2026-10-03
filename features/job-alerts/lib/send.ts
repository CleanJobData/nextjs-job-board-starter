import { and, eq, gt, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { requireMailer } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/render";
import { JobDigestTemplate, type DigestJob } from "@/lib/email/templates/JobDigestTemplate";
import { users, userPreferences } from "@/features/auth/db/schema";
import { jobs } from "@/features/job-sync/db/schema";
import { alertSettings, jobAlerts } from "../db/schema";

const FREQUENCY_HOURS: Record<"daily" | "weekly", number> = { daily: 24, weekly: 24 * 7 };
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Hard caps on emails sent, and a pause between each send.
 *
 * Blasting every due alert at once is a real deliverability problem, not a
 * performance one: a sudden burst from a domain is exactly the pattern
 * spam filters penalise, and it can get a sending domain throttled or
 * blocklisted. Alerts are processed oldest-lastSentAt first (see the
 * orderBy below), so capping a run doesn't starve anyone - whoever is cut
 * off is first in line next run.
 *
 * maxEmailsPerDay, not just maxEmailsPerRun, is what actually matters for
 * "go easy on a new domain": the shipped scheduler ticks every 15 minutes
 * (docs/CRON.md), so a per-run cap alone compounds to a large daily
 * ceiling across ~96 runs/day. The daily default is deliberately
 * conservative; an operator who knows their domain is already warmed up
 * raises it themselves from /admin/alerts.
 */
const DEFAULTS = {
  paused: false,
  maxEmailsPerRun: 20,
  delayBetweenSendsMs: 250,
  maxJobsPerDigest: 10,
  maxEmailsPerDay: 20,
  dailySentCount: 0,
  dailyWindowStartedAt: new Date(),
};

/**
 * Admin-tunable sending controls, ensuring a real row exists first - the
 * daily counter below needs somewhere to persist across runs, which a
 * fallback-object-with-no-row (the old behavior) can't provide.
 */
async function loadSettings() {
  const db = requireDb();
  await db.insert(alertSettings).values({ id: "global" }).onConflictDoNothing();
  const [row] = await db.select().from(alertSettings).limit(1);
  return row ?? DEFAULTS;
}

/** The remaining daily send budget, rolling the 24h window over automatically - returns the (possibly reset) window alongside the budget so the caller persists both together. */
function getDailyBudget(settings: typeof DEFAULTS) {
  const windowExpired = Date.now() - settings.dailyWindowStartedAt.getTime() >= DAY_MS;
  const dailySentCount = windowExpired ? 0 : settings.dailySentCount;
  const dailyWindowStartedAt = windowExpired ? new Date() : settings.dailyWindowStartedAt;
  const remaining = Math.max(0, settings.maxEmailsPerDay - dailySentCount);
  return { remaining, dailySentCount, dailyWindowStartedAt };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isDue(frequency: "daily" | "weekly", lastSentAt: Date | null) {
  if (!lastSentAt) return true;
  return Date.now() - lastSentAt.getTime() >= FREQUENCY_HOURS[frequency] * 60 * 60 * 1000;
}

/**
 * Finds every enabled, due alert and emails that user the jobs published
 * since their own watermark that match their saved preferences.
 *
 * Reads straight from the local `jobs` table rather than the CleanJobData
 * API: alerts are inherently about "what's new since last time", which is
 * exactly what job-sync's watermark-driven mirror already tracks, and it
 * keeps a scheduled task off a rate-limited external API entirely. A
 * deployment running alerts without job-sync enabled will simply find no
 * rows, which is the honest outcome - there's no local corpus to alert on.
 *
 * The watermark advances only after a successful send, so a failed email
 * retries the same jobs next run instead of silently skipping them.
 */
export async function sendDueJobAlerts(): Promise<{ sent: number; skipped: number; failed: number }> {
  const db = requireDb();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3450";
  const settings = await loadSettings();

  // Kill switch checked before any work - an operator flipping this during
  // a deliverability incident should stop sending on the very next run.
  if (settings.paused) return { sent: 0, skipped: 0, failed: 0 };

  const { remaining: dailyRemaining, dailySentCount, dailyWindowStartedAt } = getDailyBudget(settings);
  const runCap = Math.min(settings.maxEmailsPerRun, dailyRemaining);
  if (runCap <= 0) return { sent: 0, skipped: 0, failed: 0 };

  const rows = await db
    .select({ alert: jobAlerts, prefs: userPreferences, email: users.email })
    .from(jobAlerts)
    .innerJoin(users, eq(users.id, jobAlerts.userId))
    .leftJoin(userPreferences, eq(userPreferences.userId, jobAlerts.userId))
    .where(eq(jobAlerts.enabled, true))
    // Longest-waiting first (never-sent sorts first via NULLS FIRST), so a
    // run that hits the cap resumes with the same people next time instead
    // of always serving whoever happens to sort first.
    .orderBy(sql`${jobAlerts.lastSentAt} ASC NULLS FIRST`);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const { alert, prefs, email } of rows) {
    if (sent >= runCap) break;

    if (!isDue(alert.frequency, alert.lastSentAt) || !email) {
      skipped++;
      continue;
    }

    // No meaningful preference set at all (no title, location, remote-only,
    // or salary floor) means this would otherwise be an unfiltered "every
    // new job on the board" firehose - exactly the kind of digest that
    // gets an alert immediately turned back off. Withhold until they've
    // set at least one real filter, rather than sending that firehose as a
    // "better than nothing" default.
    const hasAnyPreference = Boolean(
      prefs?.titles.length || prefs?.remoteOnly || prefs?.minSalary != null || prefs?.locations.length
    );
    if (!hasAnyPreference) {
      skipped++;
      continue;
    }

    const conditions = [
      eq(jobs.isActive, true),
      eq(jobs.status, "approved" as const),
      gt(jobs.published, alert.watermark),
    ];

    if (prefs?.titles.length) {
      conditions.push(sql`${jobs.title} ILIKE ${"%" + prefs.titles[0] + "%"}`);
    }
    if (prefs?.remoteOnly) conditions.push(eq(jobs.hasRemote, true));
    if (prefs?.minSalary != null) {
      conditions.push(sql`${jobs.salaryMax} >= ${prefs.minSalary}`);
    }
    // Country-level only: a digest is a coarse "here's what's new" nudge,
    // and matching city-precision here would routinely produce empty
    // emails. The full-precision filtering lives on /jobs.
    const countryIds = (prefs?.locations ?? [])
      .map((l) => l.country_id)
      .filter((id): id is number => id != null);
    if (countryIds.length) {
      conditions.push(
        sql`${jobs.locations} @> ${JSON.stringify(countryIds.map((id) => ({ country_id: id })))}::jsonb`
      );
    }

    // Only ever sends once there's at least one real match - never an
    // empty "nothing new" email, and never waits to accumulate a full
    // maxJobsPerDigest batch before sending what it already has.
    const matches = await db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(sql`${jobs.published} DESC`)
      .limit(settings.maxJobsPerDigest);

    if (matches.length === 0) {
      skipped++;
      continue;
    }

    try {
      const digestJobs: DigestJob[] = matches.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: job.companyName,
        location: job.locationText,
        // Posted jobs live at our own internal id; synced ones round-trip on
        // CleanJobData's external id - same id-routing rule /jobs/[id] uses.
        url: `${appUrl}/jobs/${job.source === "posted" ? job.id : job.externalId}`,
      }));

      const { html, text } = await renderEmail(
        JobDigestTemplate({
          jobs: digestJobs,
          browseUrl: `${appUrl}/jobs`,
          preferencesUrl: `${appUrl}/preferences`,
        })
      );

      await requireMailer().send({
        to: email,
        subject: `${digestJobs.length} new job${digestJobs.length === 1 ? "" : "s"} matching your preferences`,
        html,
        text,
      });

      const newest = matches.reduce(
        (max, job) => (job.published > max ? job.published : max),
        alert.watermark
      );
      await db
        .update(jobAlerts)
        .set({ lastSentAt: new Date(), watermark: newest })
        .where(eq(jobAlerts.userId, alert.userId));

      sent++;
    } catch {
      // A single bad address or a transient provider error shouldn't
      // abort the rest of the batch - lastSentAt/watermark are untouched
      // on failure, so this exact user is retried first next run (same
      // oldest-lastSentAt-first ordering), instead of every other
      // already-due user behind them in this run being silently skipped.
      failed++;
      continue;
    }

    // Space the sends out rather than firing the whole batch back-to-back.
    if (sent < runCap) await sleep(settings.delayBetweenSendsMs);
  }

  if (sent > 0) {
    await db
      .update(alertSettings)
      .set({ dailySentCount: dailySentCount + sent, dailyWindowStartedAt })
      .where(eq(alertSettings.id, "global"));
  }

  return { sent, skipped, failed };
}
