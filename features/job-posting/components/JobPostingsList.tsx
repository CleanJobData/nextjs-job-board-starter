"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaBriefcase, FaLocationDot, FaGlobe, FaDollarSign } from "react-icons/fa6";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { formatAddedAgo } from "@/lib/formatAddedAgo";
import { deleteJobPosting } from "../actions/job-postings";

export type JobPostingRow = {
  id: string;
  title: string;
  companyName: string | null;
  companyLogo?: string | null;
  status: "pending" | "approved" | "rejected";
  published: string;
  locationText?: string | null;
  hasRemote?: boolean;
  salaryText?: string | null;
  employmentType?: string | null;
  /** Set by the admin dashboard's reject action (features/admin/actions/postings.ts) - surfaced here so a rejection isn't a silent dead end for the poster. */
  rejectionReason?: string | null;
};

const STATUS_VARIANT: Record<JobPostingRow["status"], "warning" | "accent" | "destructive"> = {
  pending: "warning",
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
        <Card key={p.id} className="p-4 sm:p-5 transition-colors hover:border-foreground/20">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {p.companyLogo && (
                <CompanyLogo
                  src={p.companyLogo}
                  className="h-10 w-10 rounded-lg mt-0.5"
                  iconClassName="h-4 w-4"
                />
              )}
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/jobs/${p.id}`}
                    className="font-semibold hover:text-primary hover:underline underline-offset-2 truncate"
                  >
                    {p.title}
                  </Link>
                  <Badge variant={STATUS_VARIANT[p.status]} className="capitalize">
                    {p.status}
                  </Badge>
                </div>
                {p.companyName && (
                  <Typography variant="small" className="text-muted-foreground">
                    {p.companyName}
                  </Typography>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-sm pt-0.5">
                  {p.locationText && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaLocationDot className="h-3 w-3 shrink-0" />
                      {p.locationText}
                    </span>
                  )}
                  {p.hasRemote && (
                    <span className="inline-flex items-center gap-1.5 text-primary font-medium">
                      <FaGlobe className="h-3 w-3 shrink-0" />
                      Remote
                    </span>
                  )}
                  {p.salaryText && (
                    <span className="inline-flex items-center gap-1.5">
                      <FaDollarSign className="h-3 w-3 shrink-0" />
                      {p.salaryText}
                    </span>
                  )}
                  {p.employmentType && (
                    <span className="capitalize">{p.employmentType.replace(/_/g, " ")}</span>
                  )}
                  <span>{formatAddedAgo(p.published)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start">
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
            <Typography variant="small" className="text-destructive border-t border-border pt-3 mt-3">
              Rejected: {p.rejectionReason}
            </Typography>
          )}
        </Card>
      ))}
    </div>
  );
}
