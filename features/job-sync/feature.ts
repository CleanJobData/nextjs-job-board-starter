import type { FeaturePlugin } from "../registry";
import { runIncrementalSync, runExpiredCheck, runCompanyRefresh } from "./lib/sync";

/** No nav items, no providers - jobs/actions/jobs.ts (browsing) and cronTasks (syncing) are its only integration seams. */
export const jobSyncFeature: FeaturePlugin = {
  key: "jobSync",
  cronTasks: () => [
    { key: "job-sync:incremental", run: runIncrementalSync },
    { key: "job-sync:expired-check", run: runExpiredCheck },
    { key: "job-sync:company-refresh", run: runCompanyRefresh },
  ],
};
