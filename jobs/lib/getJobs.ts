import { listJobs } from "@/jobs/lib/api";
import type { ListQuery } from "./query-types";
import type { Job, ListResponse } from "@/lib/api/types";
import config from "@/features.config";

/**
 * The one seam that decides live-API vs. cached-DB reads. Both
 * jobs/routes/HomePage.tsx (initial SSR fetch) and jobs/actions/jobs.ts's
 * getJobsAction (client "load more") call this instead of branching
 * on config.jobSync.enabled themselves - keeps the decision in one place.
 */
export async function getJobs(query: ListQuery): Promise<ListResponse<Job>> {
  if (config.jobSync.enabled) {
    const { listJobsFromCache } = await import("@/features/job-sync/lib/read");
    return listJobsFromCache(query);
  }
  return listJobs(query);
}
