"use server";

import { getJobs } from "@/lib/jobs/getJobs";
import { ListQuery } from "@/lib/jobs/query-types";
import { Job, ListResponse } from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

/**
 * Server Action to fetch jobs.
 * This can be used for "Load more" functionality.
 */
export async function getJobsAction(
  query: ListQuery
): Promise<ListResponse<Job>> {
  try {
    return await getJobs(query);
  } catch (error: any) {
    // Detailed server-side logging for developers (only visible in terminal)
    if (error instanceof ApiError) {
      console.error(`[Server Action API Error] ${error.status} ${error.message} (${error.url})`);
    }

    // Generic user-friendly messages for the browser
    throw new Error("We couldn't load more jobs. Please try again in a moment.");
  }
}
