"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db/client";
import { requireAdmin } from "@/features/authGuard";
import { jobSyncSettings } from "@/features/job-sync/db/schema";
import { syncFiltersSchema, type SyncFilters } from "@/features/job-sync/job-sync.schema";
import jobSyncConfig from "@/features/job-sync/job-sync.config";

const ADMIN_SYNC_PATH = "/admin/sync";

async function requireAdminAccess() {
  const access = await requireAdmin();
  if (access.status !== "ok") {
    throw new Error("Admin access required.");
  }
}

/**
 * The admin-set override plus job-sync.config.ts's own default, so the UI
 * can show both ("currently syncing with: X" vs "code default: Y") rather
 * than just one opaque value.
 */
export async function getSyncFiltersSetting(): Promise<{ override: SyncFilters | null; codeDefault: SyncFilters }> {
  await requireAdminAccess();
  const db = requireDb();
  const [row] = await db.select().from(jobSyncSettings).limit(1);
  return { override: row?.syncFilters ?? null, codeDefault: jobSyncConfig.syncFilters };
}

/** Validates against the same schema job-sync.config.ts itself is parsed with, so a bad override can't silently mean "no filter applied" the way CleanJobData's own API would otherwise do. */
export async function updateSyncFilters(raw: string): Promise<void> {
  await requireAdminAccess();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Not valid JSON.");
  }

  const result = syncFiltersSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(result.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; "));
  }

  const db = requireDb();
  await db
    .insert(jobSyncSettings)
    .values({ id: "global", syncFilters: result.data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: jobSyncSettings.id,
      set: { syncFilters: result.data, updatedAt: new Date() },
    });

  revalidatePath(ADMIN_SYNC_PATH);
}

/** Clears the override - the next sync falls back to job-sync.config.ts's own syncFilters. */
export async function resetSyncFilters(): Promise<void> {
  await requireAdminAccess();
  const db = requireDb();
  await db
    .insert(jobSyncSettings)
    .values({ id: "global", syncFilters: null, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: jobSyncSettings.id,
      set: { syncFilters: null, updatedAt: new Date() },
    });

  revalidatePath(ADMIN_SYNC_PATH);
}
