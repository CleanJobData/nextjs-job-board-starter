"use client";

import { useState, useTransition } from "react";
import { FaNoteSticky } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Listbox } from "@/components/ui/Listbox";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
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
    <Card className="p-4 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="min-w-0">
          {application.jobUrl ? (
            <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary">
              {application.jobTitle}
            </a>
          ) : (
            <Typography className="font-medium">{application.jobTitle}</Typography>
          )}
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
            className={notesOpen || notes ? "text-primary" : undefined}
          >
            <FaNoteSticky className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" disabled={pending} onClick={handleDelete}>
            Remove
          </Button>
        </div>
      </div>
      {notesOpen && (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder="Add a note - interview prep, contact name, anything you want to remember..."
        />
      )}
    </Card>
  );
}
