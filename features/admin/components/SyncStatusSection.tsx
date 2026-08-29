import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
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

          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Started</TableHead>
                <TableHead>Finished</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Upserted</TableHead>
                <TableHead>Expired</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.recentRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-3 text-muted-foreground">
                    No runs recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                s.recentRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(run.startedAt)}</TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(run.finishedAt)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[run.status]} className="capitalize">
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.jobsUpserted}</TableCell>
                    <TableCell>{run.jobsExpired}</TableCell>
                    <TableCell className="max-w-xs truncate text-destructive">{run.errorMessage ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ))}
    </div>
  );
}
