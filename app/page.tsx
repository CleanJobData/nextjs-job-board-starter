import * as React from "react";
import { normalizeSearchParams, mapSearchParamsToQuery } from "@/lib/jobs/query-mapper";
import { listJobs } from "@/lib/api/jobs";
import { JobList } from "@/components/jobs/JobList";
import { JobFilters } from "@/components/jobs/JobFilters";
import { ActiveFilterChips } from "@/components/jobs/ActiveFilterChips";
import { Typography } from "@/components/ui/Typography";
import { RetryButton } from "@/components/jobs/RetryButton";
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
    if (err instanceof ApiError) {
      console.error(`[API Error] ${err.status} ${err.message} (${err.url})`);
    } else {
      console.error("[Unexpected Error]", err);
    }
    error = "We encountered an issue while loading the jobs. Please try again in a moment.";
  }

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Hero Section */}
      <div className="space-y-4 max-w-3xl mb-16">
        <Typography variant="h1" className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Find your next <span className="text-primary">dream job.</span>
        </Typography>
        <Typography variant="lead" className="text-xl text-muted-foreground max-w-2xl">
          Discover curated opportunities for data professionals, engineers, and designers. 
          Structured job data for the modern workforce.
        </Typography>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar Filters */}
        <JobFilters />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <ActiveFilterChips filtersApplied={initialData?.meta?.filters_applied || []} />
          
          {error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-10 text-center space-y-6">
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
      </div>
    </div>
  );
}
