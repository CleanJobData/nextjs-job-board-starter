"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { deleteJobPosting } from "../actions/job-postings";

export type JobPostingRow = {
  id: string;
  title: string;
  companyName: string | null;
  status: "pending" | "approved" | "rejected";
  published: string;
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
        <div key={p.id} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card">
          <div className="min-w-0">
            <Link href={`/jobs/${p.id}`} className="font-semibold hover:text-primary truncate block">
              {p.title}
            </Link>
            <p className="text-xs text-muted-foreground">{p.companyName}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant={STATUS_VARIANT[p.status]} className="capitalize">
              {p.status}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              disabled={pendingId === p.id}
              onClick={() => onDelete(p.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
