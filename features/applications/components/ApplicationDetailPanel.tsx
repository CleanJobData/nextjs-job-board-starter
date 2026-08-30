"use client";

import { useEffect, useState, useTransition } from "react";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { Sheet } from "@/components/ui/Sheet";
import { Typography } from "@/components/ui/Typography";
import { Listbox } from "@/components/ui/Listbox";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  deleteApplication,
  updateApplicationNotes,
  updateApplicationStatus,
  type ApplicationStatus,
} from "../actions/applications";
import type { ApplicationRowData } from "./types";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

/**
 * Notion-style right side panel (built on the shared Sheet primitive) that
 * holds everything the compact card no longer shows: full title/company,
 * a link to the job, an editable status control, notes, and delete.
 */
export function ApplicationDetailPanel({
  application,
  onClose,
  onStatusChange,
  onNotesChange,
  onDelete,
}: {
  application: ApplicationRowData | null;
  onClose: () => void;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
  onNotesChange: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
}) {
  const [notes, setNotes] = useState(application?.notes ?? "");
  const [, startTransition] = useTransition();

  // Reset the local notes draft whenever a different application is opened.
  useEffect(() => {
    setNotes(application?.notes ?? "");
  }, [application?.id]);

  function handleStatusChange(next: ApplicationStatus) {
    if (!application) return;
    const previous = application.status;
    onStatusChange(application.id, next);
    startTransition(async () => {
      try {
        await updateApplicationStatus(application.id, next);
      } catch {
        onStatusChange(application.id, previous);
      }
    });
  }

  function handleNotesBlur() {
    if (!application) return;
    const previous = application.notes ?? "";
    onNotesChange(application.id, notes);
    startTransition(async () => {
      try {
        await updateApplicationNotes(application.id, notes);
      } catch {
        onNotesChange(application.id, previous);
        setNotes(previous);
      }
    });
  }

  function handleDelete() {
    if (!application) return;
    onDelete(application.id);
    onClose();
    return deleteApplication(application.id);
  }

  return (
    <Sheet isOpen={Boolean(application)} onClose={onClose} title="Application Details" className="max-w-lg">
      {application && (
        <div className="flex flex-col gap-6">
          <div className="space-y-1">
            <Typography variant="h3">{application.jobTitle}</Typography>
            {application.companyName && (
              <Typography className="text-muted-foreground">{application.companyName}</Typography>
            )}
            {application.jobUrl && (
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2 mt-1"
              >
                View original posting
                <FaArrowUpRightFromSquare className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="space-y-2">
            <Typography variant="small" className="font-medium text-muted-foreground">
              Status
            </Typography>
            <Listbox
              options={STATUS_OPTIONS}
              value={application.status}
              onChange={(v) => handleStatusChange(v as ApplicationStatus)}
            />
          </div>

          <div className="space-y-2">
            <Typography variant="small" className="font-medium text-muted-foreground">
              Notes
            </Typography>
            <Textarea
              key={application.id}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              rows={8}
              placeholder="Add a note - interview prep, contact name, anything you want to remember..."
            />
          </div>

          <div className="pt-2 border-t border-border flex justify-end">
            <ConfirmDialog
              trigger={<Button variant="ghost">Remove application</Button>}
              title="Remove this application?"
              description={`This removes "${application.jobTitle}" from your tracked applications, including any notes. This can't be undone.`}
              confirmLabel="Remove"
              onConfirm={handleDelete}
            />
          </div>
        </div>
      )}
    </Sheet>
  );
}
