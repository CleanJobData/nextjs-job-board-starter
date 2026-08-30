import { PageContainer } from "@/components/ui/PageContainer";
import { Typography } from "@/components/ui/Typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { FaBell } from "react-icons/fa6";
import { getAlertSettings, getAlertStats, listAlertSubscriptions } from "../../../actions/alerts";
import { AlertSettingsForm } from "../../../components/AlertSettingsForm";
import { AlertRow } from "../../../components/AlertRow";

export default async function AdminAlertsPage() {
  // Gating (feature flags + admin role) lives in the app/(admin) shim,
  // matching every other admin route; the actions below independently
  // re-check requireAdmin() so they can't be called directly either.
  const [rows, stats, settings] = await Promise.all([
    listAlertSubscriptions(),
    getAlertStats(),
    getAlertSettings(),
  ]);

  return (
    <PageContainer size="full" className="space-y-6">
      <div>
        <Typography variant="h1" className="text-3xl font-bold tracking-tight mb-1">
          Job alerts
        </Typography>
        <Typography className="text-muted-foreground">
          Who receives digest emails, and how often. Sends are batched and throttled per cron run
          to protect sending reputation.
        </Typography>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-border pt-5">
        <div className="flex items-baseline gap-2">
          <Typography className="text-2xl font-semibold tabular-nums">{stats.active}</Typography>
          <Typography variant="small" className="text-muted-foreground">active</Typography>
        </div>
        <div className="flex items-baseline gap-2">
          <Typography className="text-2xl font-semibold tabular-nums">{stats.daily}</Typography>
          <Typography variant="small" className="text-muted-foreground">daily senders</Typography>
        </div>
        <div className="flex items-baseline gap-2">
          <Typography className="text-2xl font-semibold tabular-nums">{stats.total}</Typography>
          <Typography variant="small" className="text-muted-foreground">total subscriptions</Typography>
        </div>
      </div>

      <AlertSettingsForm initial={settings} />

      {rows.length === 0 ? (
        <EmptyState
          icon={<FaBell />}
          title="No alert subscriptions yet"
          description="Once users enable email alerts from their preferences, they'll appear here."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Last sent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <AlertRow key={row.userId} row={row} />
            ))}
          </TableBody>
        </Table>
      )}
    </PageContainer>
  );
}
