"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaBriefcase } from "react-icons/fa6";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
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
    return (
      <EmptyState
        icon={<FaBriefcase />}
        title="No job postings yet"
        description="Once you've created a company profile, your postings will show up here for you to track and manage."
      />
    );
  }

  return (
    <div className="space-y-3">
      {postings.map((p) => (
        <Card key={p.id} className="p-4 flex flex-col gap-3 transition-shadow hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/jobs/${p.id}`} className="font-semibold hover:text-primary hover:underline underline-offset-2 truncate">
                  {p.title}
                </Link>
                <Badge variant={STATUS_VARIANT[p.status]} className="capitalize">
                  {p.status}
                </Badge>
              </div>
              <Typography variant="small" className="text-muted-foreground">
                {p.companyName}
              </Typography>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
          {p.status === "rejected" && p.rejectionReason && (
            <Typography variant="small" className="text-destructive border-t border-border pt-3">
              Rejected: {p.rejectionReason}
            </Typography>
          )}
        </Card>
      ))}
    </div>
  );
}
