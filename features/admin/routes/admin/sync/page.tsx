import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { getSyncStatus } from "../../../lib/sync-status";
import { SyncStatusSection } from "../../../components/SyncStatusSection";

export default async function AdminSyncPage() {
  const statuses = await getSyncStatus();

  return (
    <PageContainer size="full">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          Sync status
        </Typography>
        <Typography className="text-muted-foreground">
          Last 10 job-sync runs per kind, and whether each kind is currently due.
        </Typography>
      </div>
      <SyncStatusSection statuses={statuses} />
    </PageContainer>
  );
}
