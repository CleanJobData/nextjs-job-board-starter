import { jobSyncSchema, type JobSyncConfig } from "./job-sync.schema";

/**
 * Actual tuning values for this deployment's job-sync feature.
 * pageLimit/incrementalSyncIntervalHours should be raised to match your
 * CleanJobData plan tier (see README) - left at the API's own conservative
 * defaults here since we don't know your tier.
 */
const config: JobSyncConfig = {
  // Empty = sync everything.
  // If you want to sync only specific roles, you can add filters here.
  // Example: only remote Data/Engineering roles in the US -
  // `location` is 2-letter ISO 3166-1 country codes ONLY (e.g. "US", "CA") -
  // not free text. CleanJobData's backend silently drops anything that
  // doesn't match that pattern rather than erroring, so a typo/free-text
  // value here just quietly means "no location filter applied."
  // { location: ["US"], remoteOnly: true, title: "engineer" }
  syncFilters: {},
  incrementalSyncIntervalHours: 1,
  pageLimit: 20,
  maxPagesPerIncrementalRun: 25,
  expiredCheckIntervalHours: 24,
  expiredCheckWindowHours: 30,
  staleAfterDays: 60,
  companyRefreshIntervalHours: 168,
  companyRefreshBatchSize: 100,
};

export default jobSyncSchema.parse(config);
