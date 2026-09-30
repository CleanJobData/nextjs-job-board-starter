import * as React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

/** Mirrors JobCard.tsx's row shape (logo + title/company + one meta line), since JobGrid.tsx now renders a list of these, not a grid of card skeletons. */
export function JobCardSkeleton() {
  return (
    <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4">
      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-3/5 max-w-[260px]" />
            <Skeleton className="h-3 w-1/3 max-w-[140px]" />
          </div>
          <Skeleton className="hidden sm:block h-5 w-16 rounded-full shrink-0" />
        </div>
        <Skeleton className="h-3 w-2/3 max-w-[320px]" />
      </div>
    </div>
  );
}
