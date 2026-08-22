import { Typography } from "@/components/ui/Typography";
import { getSyncStatus } from "../../../lib/sync-status";
import { SyncStatusSection } from "../../../components/SyncStatusSection";

export default async function AdminSyncPage() {
  const statuses = await getSyncStatus();

  return (
    <div className="container mx-auto py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          Sync status
        </Typography>
        <Typography className="text-muted-foreground">
          Last 10 job-sync runs per kind, and whether each kind is currently due.
        </Typography>
      </div>
      <SyncStatusSection statuses={statuses} />
    </div>
  );
}
