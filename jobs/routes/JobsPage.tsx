import * as React from "react";
import { normalizeSearchParams, mapSearchParamsToQuery } from "@/jobs/lib/query-mapper";
import { getJobs } from "@/jobs/lib/getJobs";
import { JobList } from "@/jobs/components/JobList";
import { JobFilters } from "@/jobs/components/JobFilters";
import { ActiveFilterChips } from "@/jobs/components/ActiveFilterChips";
import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { RetryButton } from "@/jobs/components/RetryButton";
import { JobBoardSearchParams } from "@/jobs/lib/query-types";
import { ApiError } from "@/lib/api/client";
import { getPreferredJobQuery } from "@/features/onboarding/lib/preferences";

interface JobsPageProps {
  searchParams: Promise<JobBoardSearchParams>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const rawParams = await searchParams;
  const normalizedParams = normalizeSearchParams(rawParams);
  const explicitQuery = mapSearchParamsToQuery(normalizedParams);

  // Saved onboarding preferences seed the feed ONLY when the visitor
  // arrived with no filters of their own - the moment any search param is
  // present, it wins outright, so the board never silently withholds
  // results someone explicitly asked for. Signed-out visitors, deployments
  // with onboarding off, and users who skipped it all get null here and see
  // the plain unfiltered feed.
  const hasExplicitFilters = Object.keys(explicitQuery).some(
    (k) => k !== "limit" && k !== "cursor"
  );
  const preferredQuery = hasExplicitFilters ? null : await getPreferredJobQuery();
  const apiQuery = preferredQuery ? { ...explicitQuery, ...preferredQuery } : explicitQuery;

  let initialData;
  let error: string | null = null;

  try {
    initialData = await getJobs(apiQuery);
  } catch (err: any) {
    if (err instanceof ApiError) {
      console.error(`[API Error] ${err.status} ${err.message} (${err.url})`);
    } else {
      console.error("[Unexpected Error]", err);
    }
    error = "We encountered an issue while loading the jobs. Please try again in a moment.";
  }

  return (
    <PageContainer size="full">
      {/* This page is search results, not the pitch - the "Find your next
          dream job" hero now lives on the landing page (components/landing/),
          which is what a visitor sees before choosing to browse. Repeating
          the marketing pitch here, after they've already clicked through,
          would just push the actual results further down the page. */}
      <div className="mb-8">
        <Typography variant="h1" className="text-3xl font-bold tracking-tight mb-1">
          Browse Jobs
        </Typography>
        <Typography className="text-muted-foreground">
          Filter by location, salary, experience level, and more.
        </Typography>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
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
    </PageContainer>
  );
}
