"use client";

import * as React from "react";
import { Job, ListResponse } from "@/lib/api/types";
import { ListQuery } from "@/lib/jobs/query-types";
import { JobGrid } from "./JobGrid";
import { Button } from "@/components/ui/Button";
import { getJobsAction } from "@/app/actions/jobs";
import { FaSpinner } from "react-icons/fa6";

interface JobListProps {
  initialData: ListResponse<Job>;
  query: ListQuery;
}

export function JobList({ initialData, query }: JobListProps) {
  const [jobs, setJobs] = React.useState<Job[]>(initialData.data);
  const [nextCursor, setNextCursor] = React.useState<string | null>(
    initialData.pagination.next_page
  );
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when initialData changes (e.g., when filters are applied)
  React.useEffect(() => {
    setJobs(initialData.data);
    setNextCursor(initialData.pagination.next_page);
    setError(null);
  }, [initialData]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await getJobsAction({
        ...query,
        cursor: nextCursor,
      });

      setJobs((prev) => [...prev, ...result.data]);
      setNextCursor(result.pagination.next_page);
    } catch (err) {
      setError("Failed to load more jobs. Please try again.");
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="space-y-12">
      <JobGrid jobs={jobs} />

      {nextCursor && (
        <div className="flex flex-col items-center gap-4">
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="min-w-[200px]"
          >
            {isLoadingMore ? (
              <>
                <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Jobs"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
