import * as React from "react";
import { Job } from "@/lib/api/types";
import { JobCard } from "./JobCard";
import { JobCardSkeleton } from "./JobCardSkeleton";
import { Typography } from "@/components/ui/Typography";

interface JobGridProps {
  jobs: Job[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

/**
 * Despite the name (kept to avoid touching every caller), this renders one
 * dense list panel, not a grid of cards - see JobCard.tsx's doc comment.
 * The list itself is the "card": one rounded/bordered panel with a
 * hairline divider between rows, so scanning many results reads as one
 * continuous list top-to-bottom instead of a 2D grid the eye has to jump
 * around.
 */
export function JobGrid({ jobs, isLoading, emptyState }: JobGridProps) {
  if (isLoading && jobs.length === 0) {
    return (
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      emptyState || (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-xl">
          <Typography variant="h3" className="text-muted-foreground">
            No jobs found
          </Typography>
          <Typography variant="p" className="text-muted-foreground mt-2">
            Try adjusting your filters to find what you&apos;re looking for.
          </Typography>
        </div>
      )
    );
  }

  return (
    <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
      {isLoading &&
        Array.from({ length: 3 }).map((_, i) => <JobCardSkeleton key={`loading-${i}`} />)}
    </div>
  );
}
