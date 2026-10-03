import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { getSyncStatus } from "../../../lib/sync-status";
import { SyncStatusSection } from "../../../components/SyncStatusSection";
import { SyncFiltersEditor } from "../../../components/SyncFiltersEditor";
import { getSyncFiltersSetting } from "../../../actions/sync-settings";

export default async function AdminSyncPage() {
  const [statuses, filtersSetting] = await Promise.all([getSyncStatus(), getSyncFiltersSetting()]);

  return (
    <PageContainer size="full" className="space-y-8">
      <div className="mb-2">
        <Typography variant="h1" className="mb-2">
          Sync status
        </Typography>
        <Typography className="text-muted-foreground">
          Last 10 job-sync runs per kind, and whether each kind is currently due.
        </Typography>
      </div>
      <SyncFiltersEditor override={filtersSetting.override} codeDefault={filtersSetting.codeDefault} />
      <SyncStatusSection statuses={statuses} />
    </PageContainer>
  );
}
