import { and, eq, inArray, lt } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { getExpiredJobs } from "@/jobs/lib/api";
import jobSyncConfig from "../job-sync.config";
import { jobs } from "../db/schema";

/**
 * The real expiration signal: pages through GET /jobs/expired for the
 * configured window and flips isActive=false on any matching cached row.
 * Soft-delete (not a hard DELETE) to match the backend's own convention -
 * an expired row is still queryable if a future feature wants it (e.g. a
 * "recently expired" view), it just stops showing in listJobsFromCache().
 */
export async function pollExpiredJobs(): Promise<number> {
  const db = requireDb();
  const maxAge = `${jobSyncConfig.expiredCheckWindowHours}h`;

  let cursor: string | undefined;
  let flagged = 0;
  const seen = new Set<string>();

  do {
    const response = await getExpiredJobs(maxAge, cursor, 500);
    if (response.data.length === 0) break;

    const ids = response.data.map((item) => item.id).filter((id) => !seen.has(id));
    ids.forEach((id) => seen.add(id));

    if (ids.length > 0) {
      // These ids come from CleanJobData's own API (GET /jobs/expired), so
      // they live in externalId's id space, not our internal UUID `id` -
      // match against externalId (scoped to source="cleanjobdata") instead.
      const result = await db
        .update(jobs)
        .set({ isActive: false })
        .where(and(eq(jobs.source, "cleanjobdata"), inArray(jobs.externalId, ids)))
        .returning({ id: jobs.id });
      flagged += result.length;
    }

    cursor = response.pagination.next_cursor ?? undefined;
  } while (cursor);

  return flagged;
}

/** Backstop TTL delete - see the schema.ts doc comment on jobs.expiresAt for why this exists alongside pollExpiredJobs(). */
export async function pruneExpiredJobs(): Promise<number> {
  const db = requireDb();
  const deleted = await db.delete(jobs).where(lt(jobs.expiresAt, new Date())).returning({ id: jobs.id });
  return deleted.length;
}
