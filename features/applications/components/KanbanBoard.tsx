"use client";

import { useState } from "react";
import { DndContext, useDroppable, type DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { FaClipboardList } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationDetailPanel } from "./ApplicationDetailPanel";
import { updateApplicationStatus, type ApplicationStatus } from "../actions/applications";
import type { ApplicationRowData } from "./types";

const COLUMNS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

function Column({
  status,
  label,
  applications,
  pendingId,
  onOpen,
}: {
  status: ApplicationStatus;
  label: string;
  applications: ApplicationRowData[];
  pendingId: string | null;
  onOpen: (app: ApplicationRowData) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 w-72 shrink-0 rounded-lg border border-border bg-muted/20 p-3 transition-colors",
        isOver && "bg-muted/50 border-primary/50"
      )}
    >
      <div className="flex items-center justify-between px-1">
        <Typography variant="small" className="font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </Typography>
        <Typography variant="small" className="text-muted-foreground">
          {applications.length}
        </Typography>
      </div>
      <div className="flex flex-col gap-2 min-h-[80px]">
        {applications.length === 0 ? (
          <div className="rounded-md border border-dashed border-border/70 py-6 text-center">
            <Typography variant="small" className="text-muted-foreground">
              No applications
            </Typography>
          </div>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              pending={pendingId === app.id}
              onOpen={() => onOpen(app)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Notion-style kanban board for tracked applications: one column per
 * status, drag-and-drop between columns changes status, clicking a card
 * opens the detail panel (notes/status/delete live there, not on the card).
 *
 * Mobile fallback: below `sm` the board becomes a horizontally-scrolling
 * row of columns (each column keeps its fixed width) rather than a
 * column-picker/tabs view - it preserves the same mental model as desktop
 * (all statuses visible, just swipe sideways) and needs no extra UI, at the
 * cost of requiring a horizontal swipe to see every column. Drag-and-drop
 * itself isn't touch-tuned (no PointerSensor touch delay/activation
 * distance beyond default), but every status change is also available
 * from the detail panel's Listbox, so touch users are never stuck.
 */
export function KanbanBoard({ applications: initial }: { applications: ApplicationRowData[] }) {
  const [applications, setApplications] = useState(initial);
  const [activeApp, setActiveApp] = useState<ApplicationRowData | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={<FaClipboardList />}
        title="No tracked applications yet"
        description="Browse jobs and track the ones you apply to, so you can follow their status here."
        action={<Button href="/jobs">Browse jobs</Button>}
      />
    );
  }

  function applyStatus(id: string, status: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setActiveApp((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
  }

  function applyNotes(id: string, notes: string) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, notes } : a)));
    setActiveApp((prev) => (prev && prev.id === id ? { ...prev, notes } : prev));
  }

  function applyDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    setActiveApp((prev) => (prev && prev.id === id ? null : prev));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const id = active.id as string;
    const nextStatus = over.id as ApplicationStatus;
    const current = applications.find((a) => a.id === id);
    if (!current || current.status === nextStatus) return;

    const previousStatus = current.status;
    applyStatus(id, nextStatus);
    setPendingId(id);
    updateApplicationStatus(id, nextStatus)
      .catch(() => {
        applyStatus(id, previousStatus);
      })
      .finally(() => setPendingId((p) => (p === id ? null : p)));
  }

  return (
    <>
      <DndContext id="applications-kanban" sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
          {COLUMNS.map((col) => (
            <Column
              key={col.value}
              status={col.value}
              label={col.label}
              applications={applications.filter((a) => a.status === col.value)}
              pendingId={pendingId}
              onOpen={setActiveApp}
            />
          ))}
        </div>
      </DndContext>
      <ApplicationDetailPanel
        application={activeApp}
        onClose={() => setActiveApp(null)}
        onStatusChange={applyStatus}
        onNotesChange={applyNotes}
        onDelete={applyDelete}
      />
    </>
  );
}
