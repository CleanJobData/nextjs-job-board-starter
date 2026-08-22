import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { requireAdmin } from "@/features/authGuard";
import { syncRuns } from "@/features/job-sync/db/schema";
import jobSyncConfig from "@/features/job-sync/job-sync.config";

const RUN_KINDS = ["incremental", "expired_check", "company_refresh"] as const;
type RunKind = (typeof RUN_KINDS)[number];

/** Same constant each `run*()` in job-sync/lib/sync.ts already reads for its own due-check - kept in one place (job-sync.config.ts) so this display-only duplicate can't drift from the real gating logic. */
const INTERVAL_HOURS: Record<RunKind, number> = {
  incremental: jobSyncConfig.incrementalSyncIntervalHours,
  expired_check: jobSyncConfig.expiredCheckIntervalHours,
  company_refresh: jobSyncConfig.companyRefreshIntervalHours,
};

export type SyncRunRow = {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "error";
  jobsUpserted: number;
  jobsExpired: number;
  errorMessage: string | null;
};

export type SyncKindStatus = {
  kind: RunKind;
  intervalHours: number;
  lastSuccessfulRun: SyncRunRow | null;
  /**
   * Mirrors each run*() function's own inline due-check in
   * features/job-sync/lib/sync.ts (lastRun.finishedAt + intervalHours vs
   * now) - purely for display here, this does NOT gate anything; the real
   * sync route re-derives this itself on every cron hit and this duplicate
   * can never cause a sync to run early/late.
   */
  isDue: boolean;
  recentRuns: SyncRunRow[];
};

function toRow(row: typeof syncRuns.$inferSelect): SyncRunRow {
  return {
    id: row.id,
    startedAt: row.startedAt.toISOString(),
    finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
    status: row.status,
    jobsUpserted: row.jobsUpserted,
    jobsExpired: row.jobsExpired,
    errorMessage: row.errorMessage,
  };
}

/** Read-only summary of syncRuns per kind, for the admin sync-status page. No new schema - entirely existing job-sync data (see syncRuns' own doc comment in features/job-sync/db/schema.ts). */
export async function getSyncStatus(): Promise<SyncKindStatus[]> {
  const access = await requireAdmin();
  if (access.status !== "ok") {
    throw new Error("Admin access required.");
  }

  const db = requireDb();

  const results: SyncKindStatus[] = [];
  for (const kind of RUN_KINDS) {
    const runs = await db
      .select()
      .from(syncRuns)
      .where(eq(syncRuns.kind, kind))
      .orderBy(desc(syncRuns.startedAt))
      .limit(10);

    const lastSuccessful = runs.find((r) => r.status === "success") ?? null;
    const intervalHours = INTERVAL_HOURS[kind];
    const isDue = lastSuccessful?.finishedAt
      ? Date.now() >= lastSuccessful.finishedAt.getTime() + intervalHours * 60 * 60 * 1000
      : true; // no successful run yet - due immediately, same as getLastSuccessfulRun()'s undefined case in sync.ts

    results.push({
      kind,
      intervalHours,
      lastSuccessfulRun: lastSuccessful ? toRow(lastSuccessful) : null,
      isDue,
      recentRuns: runs.map(toRow),
    });
  }

  return results;
}
