"use client";

import { useState, useTransition } from "react";
import { FaNoteSticky } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Listbox } from "@/components/ui/Listbox";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import {
  deleteApplication,
  updateApplicationNotes,
  updateApplicationStatus,
  type ApplicationStatus,
} from "../actions/applications";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

// Color-codes status at a glance, mirroring the pending/approved/rejected
// badge pattern already used for job postings (JobPostingsList/PostingRow)
// so status communication reads consistently across the app.
const STATUS_BADGE_VARIANT: Record<ApplicationStatus, NonNullable<BadgeProps["variant"]>> = {
  saved: "secondary",
  applied: "outline",
  interviewing: "accent",
  offer: "default",
  rejected: "destructive",
  withdrawn: "secondary",
};

type ApplicationRowData = {
  id: string;
  jobId: string | null;
  jobTitle: string;
  companyName: string | null;
  jobUrl: string | null;
  status: ApplicationStatus;
  notes: string | null;
  updatedAt: Date;
};

export function ApplicationRow({ application }: { application: ApplicationRowData }) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [notes, setNotes] = useState(application.notes ?? "");
  const [notesOpen, setNotesOpen] = useState(Boolean(application.notes));
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);

  function handleStatusChange(next: ApplicationStatus) {
    setStatus(next);
    startTransition(() => {
      updateApplicationStatus(application.id, next);
    });
  }

  function handleNotesBlur() {
    startTransition(() => {
      updateApplicationNotes(application.id, notes);
    });
  }

  function handleDelete() {
    setRemoved(true);
    startTransition(() => {
      deleteApplication(application.id);
    });
  }

  if (removed) return null;

  return (
    <Card className={cn("p-4 sm:p-5 flex flex-col gap-4 transition-shadow hover:shadow-md", pending && "opacity-70")}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {application.jobUrl ? (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2"
              >
                {application.jobTitle}
              </a>
            ) : (
              <Typography className="font-medium">{application.jobTitle}</Typography>
            )}
            <Badge variant={STATUS_BADGE_VARIANT[status]} className="capitalize">
              {status}
            </Badge>
          </div>
          {application.companyName && (
            <Typography variant="small" className="text-muted-foreground">
              {application.companyName}
            </Typography>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-40">
            <Listbox
              options={STATUS_OPTIONS}
              value={status}
              onChange={(v) => handleStatusChange(v as ApplicationStatus)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setNotesOpen((v) => !v)}
            aria-pressed={notesOpen}
            title={notesOpen ? "Hide notes" : "Add a note"}
            className={notesOpen || notes ? "text-primary" : undefined}
          >
            <FaNoteSticky className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" disabled={pending}>
                Remove
              </Button>
            }
            title="Remove this application?"
            description={`This removes "${application.jobTitle}" from your tracked applications, including any notes. This can't be undone.`}
            confirmLabel="Remove"
            onConfirm={handleDelete}
          />
        </div>
      </div>
      {notesOpen && (
        <div className="border-t border-border pt-3">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add a note - interview prep, contact name, anything you want to remember..."
          />
        </div>
      )}
    </Card>
  );
}
