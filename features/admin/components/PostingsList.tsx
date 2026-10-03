"use client";

import { useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { PostingRow } from "./PostingRow";
import { loadMorePostings, type AdminPostingRow } from "../actions/postings";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

/** Client half of the moderation queue - owns "Load more" state so the page itself can stay a server component. */
export function PostingsList({
  initial,
  total,
  status,
}: {
  initial: AdminPostingRow[];
  total: number;
  status: StatusFilter;
}) {
  const [postings, setPostings] = useState(initial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = postings.length < total;

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const { data } = await loadMorePostings(status === "all" ? undefined : status, postings.length);
      setPostings((prev) => [...prev, ...data]);
    } catch {
      setError("Failed to load more postings. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (postings.length === 0) {
    return <Typography className="text-muted-foreground">No postings in this view.</Typography>;
  }

  return (
    <div className="space-y-3">
      {postings.map((p) => (
        <PostingRow key={p.id} posting={p} />
      ))}

      <div className="flex flex-col items-center gap-2 pt-2">
        <Typography variant="small" className="text-muted-foreground">
          Showing {postings.length} of {total}
        </Typography>
        {hasMore && (
          <>
            {error && (
              <Typography variant="small" className="text-destructive">
                {error}
              </Typography>
            )}
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoadingMore}>
              {isLoadingMore ? (
                <>
                  <FaSpinner className="h-3.5 w-3.5 mr-2 animate-spin" /> Loading...
                </>
              ) : (
                "Load more"
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
