import { count, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { applications } from "../db/schema";

export const APPLICATIONS_PAGE_SIZE = 30;

/**
 * Offset-paginated rather than loading every tracked application at once -
 * a user who has tracked hundreds of jobs over time shouldn't pay for all
 * of them on every page load. Ordered by updatedAt desc, same order the
 * unpaginated version always used, so "load more" just continues the same
 * sequence rather than changing what's already on screen.
 */
export async function getUserApplicationsPage(
  userId: string,
  { limit = APPLICATIONS_PAGE_SIZE, offset = 0 }: { limit?: number; offset?: number } = {}
) {
  const db = requireDb();

  const [data, totalRows] = await Promise.all([
    db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(applications).where(eq(applications.userId, userId)),
  ]);

  return { data, total: totalRows[0]?.total ?? 0 };
}
