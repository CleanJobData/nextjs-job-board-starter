import { apiFetch } from "./client";
import { ExpiredJobsResponse, Job, JobDetail, ListResponse } from "./types";
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

/**
 * Fetches recently-expired job IDs. `maxAge` is a relative duration string
 * (e.g. "24h", "7d", "1w") - the endpoint has no absolute `since` param.
 * Shares the same monthly quota as listJobs() on most plan tiers.
 */
export async function getExpiredJobs(
  maxAge: string,
  cursor?: string,
  limit?: number
): Promise<ExpiredJobsResponse> {
  const params = new URLSearchParams({ max_age: maxAge });
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));

  return apiFetch<ExpiredJobsResponse>(`/jobs/expired?${params.toString()}`);
}
