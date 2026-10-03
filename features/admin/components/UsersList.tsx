"use client";

import { useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { UserRow } from "./UserRow";
import { loadMoreUsers, type AdminUserRow } from "../actions/users";

/** Client half of the users page - owns "Load more" state so the page itself can stay a server component. */
export function UsersList({
  initial,
  total,
  query,
  currentUserId,
}: {
  initial: AdminUserRow[];
  total: number;
  query: string;
  currentUserId: string | undefined;
}) {
  const [users, setUsers] = useState(initial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasMore = users.length < total;

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const { data } = await loadMoreUsers(query || undefined, users.length);
      setUsers((prev) => [...prev, ...data]);
    } catch {
      setError("Failed to load more users. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (users.length === 0) {
    return <Typography className="text-muted-foreground">No users match that search.</Typography>;
  }

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
      ))}

      <div className="flex flex-col items-center gap-2 pt-2">
        <Typography variant="small" className="text-muted-foreground">
          Showing {users.length} of {total}
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
