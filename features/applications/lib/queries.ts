import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { applications } from "../db/schema";

export async function getUserApplications(userId: string) {
  const db = requireDb();
  return db
    .select()
    .from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.updatedAt));
}
