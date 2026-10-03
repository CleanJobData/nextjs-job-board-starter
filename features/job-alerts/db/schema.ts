import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { users } from "@/features/auth/db/schema";

/**
 * Email alerts for new jobs matching a user's saved preferences
 * (features/auth/db/schema.ts's userPreferences - deliberately reused
 * rather than duplicating a second copy of the same filter fields, so
 * "what I see on /jobs" and "what I get emailed" can never drift apart).
 *
 * One row per user (userId is the PK, same 1:1 reasoning as
 * userPreferences). Supporting several independent saved searches per
 * user is a real future want, but it changes this table's key and the
 * settings UI shape, so v1 stays 1:1 rather than half-building it.
 */
export const jobAlerts = pgTable("jobAlerts", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").notNull().default(false),
  frequency: text("frequency").$type<"daily" | "weekly">().notNull().default("weekly"),
  /**
   * Only jobs published AFTER this instant go into the next digest - this
   * is what stops every send from re-listing the same jobs. Set to "now"
   * when an alert is first enabled so the first digest covers genuinely
   * new postings rather than dumping the entire back catalogue.
   */
  watermark: timestamp("watermark", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  lastSentAt: timestamp("lastSentAt", { mode: "date", withTimezone: true }),
});

/**
 * Deployment-wide alert sending controls, adjustable by an admin at
 * runtime from /admin/alerts.
 *
 * These live in the DB rather than a checked-in config file (unlike
 * job-sync.config.ts, the usual home for feature tuning) for one specific
 * reason: they exist to be changed DURING an incident. If a sending
 * domain starts getting throttled, an operator needs to pause sending or
 * drop the batch size immediately - waiting on a code edit, review and
 * redeploy is exactly the wrong loop for that.
 *
 * Single row, pinned to id="global" - a CHECK-style constant PK rather
 * than a bare boolean, so "there is exactly one settings row" is enforced
 * by the schema instead of by convention.
 */
export const alertSettings = pgTable("alertSettings", {
  id: text("id").primaryKey().default("global"),
  /** Master kill switch - stops every send without users losing their subscriptions. */
  paused: boolean("paused").notNull().default(false),
  /**
   * Per-cron-tick cap. On its own this is NOT "light for a new domain" -
   * the shipped scheduler ticks every 15 minutes (see docs/CRON.md), so
   * even a modest per-run number compounds to a large daily ceiling
   * across ~96 runs/day. maxEmailsPerDay below is the knob that actually
   * controls total daily volume; this one just bounds how bursty a
   * single run can be.
   */
  maxEmailsPerRun: integer("maxEmailsPerRun").notNull().default(20),
  delayBetweenSendsMs: integer("delayBetweenSendsMs").notNull().default(250),
  maxJobsPerDigest: integer("maxJobsPerDigest").notNull().default(10),
  /**
   * The real "go easy on a brand-new sending domain" default - deliberately
   * conservative (most ESP/deliverability guidance for a cold domain starts
   * well under 100/day) so a fresh deployment doesn't torch its own sender
   * reputation in week one. An operator who knows their domain is warmed up
   * raises this themselves from /admin/alerts.
   */
  maxEmailsPerDay: integer("maxEmailsPerDay").notNull().default(20),
  /** Rolling 24h counter backing maxEmailsPerDay - see send.ts's getEffectiveDailyBudget(). Not meant to be hand-edited; reset automatically once dailyWindowStartedAt is >24h old. */
  dailySentCount: integer("dailySentCount").notNull().default(0),
  dailyWindowStartedAt: timestamp("dailyWindowStartedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
});
