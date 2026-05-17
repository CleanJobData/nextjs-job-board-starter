import * as React from "react";
import { normalizeSearchParams, mapSearchParamsToQuery } from "@/lib/jobs/query-mapper";
import { listJobs } from "@/lib/api/jobs";
import { JobList } from "@/app/components/JobList";
import { Typography } from "@/components/ui/Typography";
import { RetryButton } from "@/app/components/RetryButton";
import { JobBoardSearchParams } from "@/lib/jobs/query-types";
import { ApiError } from "@/lib/api/client";

interface HomePageProps {
  searchParams: Promise<JobBoardSearchParams>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawParams = await searchParams;
  const normalizedParams = normalizeSearchParams(rawParams);
  const apiQuery = mapSearchParamsToQuery(normalizedParams);

  let initialData;
  let error: string | null = null;

  try {
    initialData = await listJobs(apiQuery);
  } catch (err: any) {
    // Detailed server-side logging for developers (only visible in terminal)
    if (err instanceof ApiError) {
      console.error(`[API Error] ${err.status} ${err.message} (${err.url})`);
    } else {
      console.error("[Unexpected Error]", err);
    }

    // Generic user-friendly messages for the browser
    error = "We encountered an issue while loading the jobs. Please try again in a moment.";
  }

  return (
    <div className="container mx-auto py-12 px-4 space-y-12">
      <div className="space-y-4 max-w-3xl">
        <Typography variant="h1" className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Find your next data role
        </Typography>
        <Typography variant="lead" className="text-xl text-muted-foreground">
          The most comprehensive list of data engineering, science, and analytics jobs from across the web.
        </Typography>
      </div>

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-10 text-center mx-auto space-y-6">
          <div className="space-y-2">
            <Typography variant="h4" className="text-destructive">
              Something went wrong
            </Typography>
            <Typography variant="p" className="text-muted-foreground">
              {error}
            </Typography>
          </div>
          
          <div className="flex justify-center">
            <RetryButton />
          </div>
        </div>
      ) : initialData ? (
        <JobList initialData={initialData} query={apiQuery} />
      ) : (
        <div className="text-center py-20">
          <Typography variant="muted">Loading jobs...</Typography>
        </div>
      )}
    </div>
  );
}
