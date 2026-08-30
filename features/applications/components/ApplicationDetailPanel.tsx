"use client";

import { useEffect, useState, useTransition } from "react";
import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import { Sheet } from "@/components/ui/Sheet";
import { Typography } from "@/components/ui/Typography";
import { Listbox } from "@/components/ui/Listbox";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  deleteApplication,
  getApplicationJobDetail,
  updateApplicationNotes,
  updateApplicationStatus,
  type ApplicationJobDetail,
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
  /** Last value actually persisted - compared against the draft to know whether there are unsaved edits. */
  const [savedNotes, setSavedNotes] = useState(application?.notes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);
  const [, startTransition] = useTransition();
  const [jobDetail, setJobDetail] = useState<ApplicationJobDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Reset the local notes draft whenever a different application is opened.
  useEffect(() => {
    setNotes(application?.notes ?? "");
    setSavedNotes(application?.notes ?? "");
  }, [application?.id]);

  const notesDirty = notes !== savedNotes;

  // Fetch extra job context (description/location/salary) on open - not
  // stored on the application row itself, since it's genuinely live/full
  // data not needed until someone actually opens the panel. No jobId means
  // the underlying job was never synced or has since been deleted - the
  // panel still works fine with just the snapshot fields in that case.
  useEffect(() => {
    setJobDetail(null);
    if (!application?.jobId) return;
    setLoadingDetail(true);
    getApplicationJobDetail(application.jobId)
      .then(setJobDetail)
      .finally(() => setLoadingDetail(false));
  }, [application?.id, application?.jobId]);

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

  function handleSaveNotes() {
    if (!application) return;
    const previous = application.notes ?? "";
    setNotesSaving(true);
    onNotesChange(application.id, notes);
    startTransition(async () => {
      try {
        await updateApplicationNotes(application.id, notes);
        setSavedNotes(notes);
      } catch {
        onNotesChange(application.id, previous);
        setNotes(previous);
      } finally {
        setNotesSaving(false);
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
          <div className="flex items-start gap-3">
            {application.companyLogo && (
              <CompanyLogo src={application.companyLogo} className="h-10 w-10 rounded-lg mt-0.5" iconClassName="h-4 w-4" />
            )}
            <div className="space-y-1 min-w-0">
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
          </div>

          {loadingDetail ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : jobDetail ? (
            <div className="space-y-3">
              {(jobDetail.locationText || jobDetail.hasRemote || jobDetail.employmentType || jobDetail.salaryText) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {jobDetail.locationText && <span>{jobDetail.locationText}</span>}
                  {jobDetail.hasRemote && <span>Remote</span>}
                  {jobDetail.employmentType && <span>{jobDetail.employmentType}</span>}
                  {jobDetail.salaryText && <span>{jobDetail.salaryText}</span>}
                </div>
              )}
              {jobDetail.description && (
                // CleanJobData's description field is real HTML (headings/
                // paragraphs/bold), not plain text - matches JobDetailView's
                // existing rendering exactly (same prose classes), otherwise
                // the raw <h3>/<p> tags would print out literally instead of
                // rendering as formatted text.
                <div
                  className="job-description prose prose-sm max-w-none prose-neutral dark:prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: jobDetail.description }}
                />
              )}
            </div>
          ) : null}

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
            <div className="flex items-center justify-between gap-3">
              <Typography variant="small" className="font-medium text-muted-foreground">
                Notes
              </Typography>
              {/* An explicit Save button, not just save-on-blur: blur-saving
                  gave no feedback at all, so it read as "my notes weren't
                  saved" even when they were. Blur still saves (below) so a
                  click-away never silently loses work - the button is the
                  visible confirmation, and it reports its own state. */}
              <div className="flex items-center gap-2">
                {!notesDirty && !notesSaving && savedNotes !== "" && (
                  <Typography variant="small" className="text-muted-foreground">
                    Saved
                  </Typography>
                )}
                <Button
                  size="sm"
                  variant={notesDirty ? "default" : "ghost"}
                  disabled={!notesDirty || notesSaving}
                  onClick={handleSaveNotes}
                >
                  {notesSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
            <Textarea
              key={application.id}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notesDirty && handleSaveNotes()}
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
