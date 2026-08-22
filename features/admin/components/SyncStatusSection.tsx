import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import type { SyncKindStatus, SyncRunRow } from "../lib/sync-status";

const KIND_LABEL: Record<SyncKindStatus["kind"], string> = {
  incremental: "Incremental sync",
  expired_check: "Expired check",
  company_refresh: "Company refresh",
};

const STATUS_VARIANT: Record<SyncRunRow["status"], "accent" | "destructive" | "secondary"> = {
  success: "accent",
  error: "destructive",
  running: "secondary",
};

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString();
}

/** Server component - a pure read view over syncRuns, no interactivity, so it doesn't need "use client". */
export function SyncStatusSection({ statuses }: { statuses: SyncKindStatus[] }) {
  return (
    <div className="space-y-8">
      {statuses.map((s) => (
        <Card key={s.kind} className="p-5">
          <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
            <Typography variant="h3">{KIND_LABEL[s.kind]}</Typography>
            <div className="flex items-center gap-2">
              <Typography variant="small" className="text-muted-foreground">
                every {s.intervalHours}h
              </Typography>
              <Badge variant={s.isDue ? "secondary" : "outline"}>{s.isDue ? "Due" : "Not due"}</Badge>
            </div>
          </div>

          {s.lastSuccessfulRun ? (
            <Typography variant="small" className="text-muted-foreground mb-4">
              Last successful run: {formatDate(s.lastSuccessfulRun.finishedAt)} - upserted{" "}
              {s.lastSuccessfulRun.jobsUpserted}, expired {s.lastSuccessfulRun.jobsExpired}
            </Typography>
          ) : (
            <Typography variant="small" className="text-muted-foreground mb-4">
              No successful run yet.
            </Typography>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4">Started</th>
                  <th className="py-2 pr-4">Finished</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Upserted</th>
                  <th className="py-2 pr-4">Expired</th>
                  <th className="py-2 pr-4">Error</th>
                </tr>
              </thead>
              <tbody>
                {s.recentRuns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-muted-foreground">
                      No runs recorded yet.
                    </td>
                  </tr>
                ) : (
                  s.recentRuns.map((run) => (
                    <tr key={run.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDate(run.startedAt)}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDate(run.finishedAt)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={STATUS_VARIANT[run.status]} className="capitalize">
                          {run.status}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{run.jobsUpserted}</td>
                      <td className="py-2 pr-4">{run.jobsExpired}</td>
                      <td className="py-2 pr-4 max-w-xs truncate text-destructive">{run.errorMessage ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
