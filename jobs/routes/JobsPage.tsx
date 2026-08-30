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
import { redirect } from "next/navigation";
import { getPreferredSearchParams } from "@/features/onboarding/lib/preferences";

interface JobsPageProps {
  searchParams: Promise<JobBoardSearchParams>;
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const rawParams = await searchParams;
  const normalizedParams = normalizeSearchParams(rawParams);
  const explicitQuery = mapSearchParamsToQuery(normalizedParams);

  // Saved preferences seed the feed only on a genuinely bare /jobs - and
  // by REDIRECTING to /jobs?<prefs> rather than applying them invisibly,
  // so the URL stays the single source of truth and the existing filter
  // chips can actually remove them (a chip whose filter isn't in the URL
  // has nothing to delete, so its remove button silently does nothing).
  //
  // `all=1` is the escape hatch "Clear all" uses: bare /jobs would just
  // redirect straight back here, so clearing needs a URL that explicitly
  // means "no preferences, show me everything".
  const isBareVisit = Object.keys(rawParams).length === 0;
  if (isBareVisit) {
    const preferred = await getPreferredSearchParams();
    if (preferred) redirect(`/jobs?${preferred.toString()}`);
  }

  const apiQuery = explicitQuery;
  const preferencesApplied = !isBareVisit && rawParams.all !== "1";

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
          <ActiveFilterChips
            filtersApplied={initialData?.meta?.filters_applied || []}
            clearAllHref={preferencesApplied ? "/jobs?all=1" : undefined}
          />

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
