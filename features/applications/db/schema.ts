import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "@/features/auth/db/schema";
import { jobs } from "@/features/job-sync/db/schema";

/**
 * A personal application tracker - NOT a real "submit to employer" flow
 * (most synced jobs have their own external application_url; job-posting's
 * own postings, once built, are a separate concern). One row per job a
 * user has decided to track.
 *
 * `jobId` is a real, enforced foreign key into `jobs` now. It used to be a
 * bare column with no FK at all, back when job-sync's cache (`cachedJobs`)
 * was optional and its rows got pruned on TTL expiry - a hard FK then would
 * have meant a user's application history silently breaking or cascading
 * away whenever the cache entry it pointed to expired. That's no longer
 * the tradeoff: `jobs` merged the old cache into one permanent core table
 * (source-discriminated "cleanjobdata"/"posted" - see its doc comment in
 * features/job-sync/db/schema.ts), so a real reference is safe.
 *
 * It's `onDelete: "set null"`, not "cascade", though (hence nullable, not
 * .notNull()): jobId/jobTitle/companyName/jobUrl were already a
 * self-sufficient snapshot captured at track time, so an application row
 * stays meaningful on its own even if the `jobs` row it pointed at is
 * later deleted - it should lose the live link, not disappear itself.
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
    jobId: text("jobId").references(() => jobs.id, { onDelete: "set null" }),
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
