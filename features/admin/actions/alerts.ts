"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { requireAdmin } from "@/features/authGuard";
import { users } from "@/features/auth/db/schema";
import { alertSettings, jobAlerts } from "@/features/job-alerts/db/schema";

export type AdminAlertRow = {
  userId: string;
  email: string | null;
  name: string | null;
  enabled: boolean;
  frequency: "daily" | "weekly";
  lastSentAt: Date | null;
};

/** Every alert subscription, newest-sent first - the operator's view of how much mail this deployment is actually sending. */
export async function listAlertSubscriptions(): Promise<AdminAlertRow[]> {
  await requireAdmin();
  const db = requireDb();
  return db
    .select({
      userId: jobAlerts.userId,
      email: users.email,
      name: users.name,
      enabled: jobAlerts.enabled,
      frequency: jobAlerts.frequency,
      lastSentAt: jobAlerts.lastSentAt,
    })
    .from(jobAlerts)
    .innerJoin(users, eq(users.id, jobAlerts.userId))
    .orderBy(desc(jobAlerts.lastSentAt));
}

export async function getAlertStats() {
  await requireAdmin();
  const db = requireDb();
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) FILTER (WHERE ${jobAlerts.enabled})::int`,
      daily: sql<number>`count(*) FILTER (WHERE ${jobAlerts.enabled} AND ${jobAlerts.frequency} = 'daily')::int`,
    })
    .from(jobAlerts);
  return row ?? { total: 0, active: 0, daily: 0 };
}

/**
 * Lets an operator switch a single subscription off - the escape hatch for
 * a bouncing or complaining address, which is a deliverability problem the
 * user themselves can't always fix (they may never open the email to find
 * the unsubscribe link). Deliberately one-way: an admin can disable, but
 * re-enabling is the user's own choice to make from /preferences.
 */
export async function disableAlertForUser(userId: string) {
  await requireAdmin();
  const db = requireDb();
  await db.update(jobAlerts).set({ enabled: false }).where(eq(jobAlerts.userId, userId));
  revalidatePath("/admin/alerts");
}

export type AlertSettingsInput = {
  paused: boolean;
  maxEmailsPerRun: number;
  delayBetweenSendsMs: number;
  maxJobsPerDigest: number;
};

export async function getAlertSettings(): Promise<AlertSettingsInput> {
  await requireAdmin();
  const db = requireDb();
  const [row] = await db.select().from(alertSettings).limit(1);
  return {
    paused: row?.paused ?? false,
    maxEmailsPerRun: row?.maxEmailsPerRun ?? 50,
    delayBetweenSendsMs: row?.delayBetweenSendsMs ?? 250,
    maxJobsPerDigest: row?.maxJobsPerDigest ?? 10,
  };
}

/** Clamped server-side, not just in the form - these directly drive how much mail leaves the domain, so a bad value is a deliverability incident rather than a cosmetic bug. */
export async function updateAlertSettings(input: AlertSettingsInput) {
  await requireAdmin();
  const db = requireDb();
  const row = {
    id: "global",
    paused: input.paused,
    maxEmailsPerRun: Math.max(1, Math.min(500, Math.round(input.maxEmailsPerRun))),
    delayBetweenSendsMs: Math.max(0, Math.min(10_000, Math.round(input.delayBetweenSendsMs))),
    maxJobsPerDigest: Math.max(1, Math.min(50, Math.round(input.maxJobsPerDigest))),
    updatedAt: new Date(),
  };
  await db.insert(alertSettings).values(row).onConflictDoUpdate({ target: alertSettings.id, set: row });
  revalidatePath("/admin/alerts");
}
