import { listJobs, getJobById } from "@/jobs/lib/api";
import type { ListQuery } from "./query-types";
import type { Job, JobDetail, ListResponse } from "@/lib/api/types";
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

/**
 * Job detail's own seam, parallel to getJobs() above but with one extra
 * branch in front: a source="posted" job (job-posting feature) has no
 * CleanJobData identity to fetch live, so we check our own DB for it FIRST,
 * regardless of whether job-sync's cache is enabled - a posted job can
 * exist even in a deployment that has job-sync (and therefore
 * listJobsFromCache's public feed unification) disabled, since createJobPosting()
 * writes to the same `jobs` table either way. Only a miss here falls
 * through to the existing cache-or-live CleanJobData path.
 */
export async function getJobDetail(id: string): Promise<JobDetail> {
  const { getPostedJobById } = await import("@/features/job-sync/lib/read");
  const posted = await getPostedJobById(id);
  if (posted) return posted;

  if (config.jobSync.enabled) {
    // No cache-backed single-job read path exists yet for cleanjobdata rows
    // (job detail has always fetched live, even when the list is served
    // from cache - see this repo's existing JobDetailPage.tsx comment) -
    // unaffected by this phase, unchanged behavior for cleanjobdata jobs.
  }
  return getJobById(id);
}
