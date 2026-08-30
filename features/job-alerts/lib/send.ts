import { and, eq, gt, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { requireMailer } from "@/lib/email/mailer";
import { renderEmail } from "@/lib/email/render";
import { JobDigestTemplate, type DigestJob } from "@/lib/email/templates/JobDigestTemplate";
import { users, userPreferences } from "@/features/auth/db/schema";
import { jobs } from "@/features/job-sync/db/schema";
import { alertSettings, jobAlerts } from "../db/schema";

const FREQUENCY_HOURS: Record<"daily" | "weekly", number> = { daily: 24, weekly: 24 * 7 };
/**
 * Hard cap on emails sent per cron run, and a pause between each send.
 *
 * Blasting every due alert at once is a real deliverability problem, not a
 * performance one: a sudden burst from a domain is exactly the pattern
 * spam filters penalise, and it can get a sending domain throttled or
 * blocklisted. Alerts are processed oldest-lastSentAt first (see the
 * orderBy below), so capping a run doesn't starve anyone - whoever is cut
 * off is first in line next run. Tune these together with how often the
 * scheduler actually hits /api/cron.
 */
const DEFAULTS = { paused: false, maxEmailsPerRun: 50, delayBetweenSendsMs: 250, maxJobsPerDigest: 10 };

/** Admin-tunable sending controls, falling back to DEFAULTS until a row exists (see alertSettings). */
async function loadSettings() {
  const db = requireDb();
  const [row] = await db.select().from(alertSettings).limit(1);
  return row ?? DEFAULTS;
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
export async function sendDueJobAlerts(): Promise<{ sent: number; skipped: number }> {
  const db = requireDb();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const settings = await loadSettings();

  // Kill switch checked before any work - an operator flipping this during
  // a deliverability incident should stop sending on the very next run.
  if (settings.paused) return { sent: 0, skipped: 0 };

  const rows = await db
    .select({ alert: jobAlerts, prefs: userPreferences, email: users.email })
    .from(jobAlerts)
    .innerJoin(users, eq(users.id, jobAlerts.userId))
    .leftJoin(userPreferences, eq(userPreferences.userId, jobAlerts.userId))
    .where(eq(jobAlerts.enabled, true))
    // Longest-waiting first (never-sent sorts first via NULLS FIRST), so a
    // run that hits MAX_EMAILS_PER_RUN resumes with the same people next
    // time instead of always serving whoever happens to sort first.
    .orderBy(sql`${jobAlerts.lastSentAt} ASC NULLS FIRST`);

  let sent = 0;
  let skipped = 0;

  for (const { alert, prefs, email } of rows) {
    if (sent >= settings.maxEmailsPerRun) break;

    if (!isDue(alert.frequency, alert.lastSentAt) || !email) {
      skipped++;
      continue;
    }

    const conditions = [
      eq(jobs.isActive, true),
      eq(jobs.status, "approved" as const),
      gt(jobs.published, alert.watermark),
    ];

    // Preferences are optional - an alert with none is a plain "anything
    // new" digest rather than an error.
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
    // Space the sends out rather than firing the whole batch back-to-back.
    if (sent < settings.maxEmailsPerRun) await sleep(settings.delayBetweenSendsMs);
  }

  return { sent, skipped };
}
