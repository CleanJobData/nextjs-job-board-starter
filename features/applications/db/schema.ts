import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "@/features/auth/db/schema";

/**
 * A personal application tracker - NOT a real "submit to employer" flow
 * (most synced jobs have their own external application_url; job-posting's
 * own postings, once built, are a separate concern). One row per job a
 * user has decided to track.
 *
 * Deliberately NOT a foreign key to job-sync's cachedJobs, even though the
 * original plan assumed that reference:
 * 1. job-sync is optional - a deployment without it enabled has no
 *    cachedJobs rows at all, and applications must work regardless of
 *    whether job-sync is on.
 * 2. Even when job-sync IS enabled, cachedJobs rows are not permanent -
 *    they get pruned on TTL expiry (features/job-sync/lib/expire.ts). A
 *    hard FK there would mean a user's own application history silently
 *    breaks or cascades away whenever the cache entry it pointed to
 *    expired - exactly the kind of cross-feature fragility this
 *    architecture is meant to avoid.
 *
 * Instead, jobId/jobTitle/companyName/jobUrl are a self-sufficient
 * snapshot captured at the moment the user tracks the job - the record
 * stays meaningful forever, independent of whatever job-sync does later.
 */
export const applications = pgTable(
  "applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("jobId").notNull(),
    jobTitle: text("jobTitle").notNull(),
    companyName: text("companyName"),
    jobUrl: text("jobUrl"),
    status: text("status")
      .$type<"saved" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn">()
      .notNull()
      .default("saved"),
    notes: text("notes"),
    appliedAt: timestamp("appliedAt", { mode: "date", withTimezone: true }),
    createdAt: timestamp("createdAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updatedAt", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // Enforces "one tracked row per (user, job)" at the DB level - re-tracking
    // the same job updates the existing row via onConflictDoUpdate, never
    // duplicates. userId is the leftmost column, so this also serves plain
    // "all of this user's applications" lookups without a separate index.
    uniqueIndex("applicationsUserIdJobIdIdx").on(t.userId, t.jobId),
  ]
);
