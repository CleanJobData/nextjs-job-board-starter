import { apiFetch } from "./client";
import { Job, JobDetail, ListResponse } from "./types";
import { ListQuery } from "../jobs/query-types";
import { buildApiUrlParams } from "../jobs/query-mapper";

/**
 * Fetches a list of jobs from the CleanJobData API.
 */
export async function listJobs(
  query: ListQuery = {}
): Promise<ListResponse<Job>> {
  const params = buildApiUrlParams(query);
  const queryString = params.toString();
  const endpoint = `/jobs${queryString ? `?${queryString}` : ""}`;

  return apiFetch<ListResponse<Job>>(endpoint);
}

/**
 * Fetches the full details of a single job by its ID.
 */
export async function getJobById(id: string): Promise<JobDetail> {
  return apiFetch<JobDetail>(`/jobs/${id}`);
}
