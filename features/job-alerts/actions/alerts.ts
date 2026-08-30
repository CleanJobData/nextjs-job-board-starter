"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { users, userPreferences } from "@/features/auth/db/schema";
import featuresConfig from "@/features.config";
import { jobAlerts } from "../db/schema";

async function requireUserId(): Promise<string> {
  if (!featuresConfig.jobAlerts.enabled) throw new Error("Job alerts are disabled.");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

/** Everything the /preferences page renders - saved search prefs plus alert settings. */
export async function getMySettings() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const db = requireDb();

  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  const [alert] = await db.select().from(jobAlerts).where(eq(jobAlerts.userId, userId)).limit(1);
  return { prefs: prefs ?? null, alert: alert ?? null };
}

export async function updateAlertSettings(input: { enabled: boolean; frequency: "daily" | "weekly" }) {
  const userId = await requireUserId();
  const db = requireDb();

  // watermark defaults to now() on insert, so switching alerts on sends the
  // next digest from *this moment* forward rather than replaying every job
  // already in the mirror.
  const row = { userId, enabled: input.enabled, frequency: input.frequency };
  await db
    .insert(jobAlerts)
    .values(row)
    .onConflictDoUpdate({ target: jobAlerts.userId, set: row });

  revalidatePath("/preferences");
}
