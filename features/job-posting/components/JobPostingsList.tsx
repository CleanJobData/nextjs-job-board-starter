"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { deleteJobPosting } from "../actions/job-postings";

export type JobPostingRow = {
  id: string;
  title: string;
  companyName: string | null;
  status: "pending" | "approved" | "rejected";
  published: string;
  /** Set by the admin dashboard's reject action (features/admin/actions/postings.ts) - surfaced here so a rejection isn't a silent dead end for the poster. */
  rejectionReason?: string | null;
};

const STATUS_VARIANT: Record<JobPostingRow["status"], "secondary" | "accent" | "destructive"> = {
  pending: "secondary",
  approved: "accent",
  rejected: "destructive",
};

/**
 * Status is display-only here - there is no UI yet (this phase) to move a
 * job from "pending" to "approved"/"rejected"; that's phase 3's admin
 * dashboard. A poster can see where their posting stands but can't act on
 * the moderation state itself, only edit/delete their own posting.
 */
export function JobPostingsList({ postings }: { postings: JobPostingRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onDelete(id: string) {
    setPendingId(id);
    try {
      await deleteJobPosting(id);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (postings.length === 0) {
    return <Typography className="text-muted-foreground">You haven&apos;t posted any jobs yet.</Typography>;
  }

  return (
    <div className="space-y-3">
      {postings.map((p) => (
        <div
          key={p.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 rounded-xl border border-border bg-card"
        >
          <div className="min-w-0">
            <Link href={`/jobs/${p.id}`} className="font-semibold hover:text-primary truncate block">
              {p.title}
            </Link>
            <Typography variant="small" className="text-muted-foreground">
              {p.companyName}
            </Typography>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={STATUS_VARIANT[p.status]} className="capitalize">
              {p.status}
            </Badge>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" disabled={pendingId === p.id}>
                  Delete
                </Button>
              }
              title="Delete this job posting?"
              description={`This permanently deletes "${p.title}". This can't be undone.`}
              confirmLabel="Delete"
              onConfirm={() => onDelete(p.id)}
            />
          </div>
        </div>
      ))}
      {postings.some((p) => p.status === "rejected" && p.rejectionReason) && (
        <div className="space-y-2">
          {postings
            .filter((p) => p.status === "rejected" && p.rejectionReason)
            .map((p) => (
              <Typography key={p.id} variant="small" className="text-muted-foreground">
                &quot;{p.title}&quot; was rejected: {p.rejectionReason}
              </Typography>
            ))}
        </div>
      )}
    </div>
  );
}
