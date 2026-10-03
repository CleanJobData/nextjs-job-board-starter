"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { FaClipboardList, FaSpinner } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { ApplicationCard, ApplicationCardContent } from "./ApplicationCard";
import { ApplicationDetailPanel } from "./ApplicationDetailPanel";
import { updateApplicationStatus, loadMoreApplications, type ApplicationStatus } from "../actions/applications";
import type { ApplicationRowData } from "./types";

const COLUMNS: { value: ApplicationStatus; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

/**
 * A vivid top accent bar + a real (not barely-there) background/border
 * tint per status, built from existing tokens only (primary/accent/
 * warning/destructive - never raw hex), applied to the column itself
 * rather than per-card chrome. A column-level treatment is one clear
 * signal per status instead of repeating it as chrome on every card,
 * which read as noisy - but the tint needs to actually read as color at a
 * glance, not just a faint wash, hence the solid top bar doing most of the
 * "lively" work while the background stays a supporting tint.
 */
const COLUMN_STYLES: Record<ApplicationStatus, { bar: string; body: string; label: string }> = {
  saved: { bar: "bg-muted-foreground", body: "bg-muted/60 border-border", label: "text-foreground" },
  applied: { bar: "bg-primary", body: "bg-primary/10 border-primary/30", label: "text-primary" },
  interviewing: { bar: "bg-accent-foreground", body: "bg-accent border-accent-foreground/30", label: "text-accent-foreground" },
  offer: { bar: "bg-warning", body: "bg-warning/15 border-warning/40", label: "text-warning-foreground" },
  rejected: { bar: "bg-destructive", body: "bg-destructive/10 border-destructive/30", label: "text-destructive" },
  withdrawn: { bar: "bg-secondary-foreground/50", body: "bg-secondary/80 border-border", label: "text-secondary-foreground" },
};

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
  const styles = COLUMN_STYLES[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // No independent height/scroll here - a column only ever stretches
        // to match whichever sibling has the most cards (flex's default
        // "stretch" among row siblings). That shared natural height is what
        // KanbanBoard's row scrolls as ONE unit (overflow on the row, not
        // here) - every column moves together instead of each one having
        // its own out-of-sync scrollbar.
        "flex flex-col w-60 shrink-0 rounded-lg border transition-colors",
        styles.body,
        isOver && "ring-1 ring-inset ring-foreground/20"
      )}
    >
      {/* rounded-t-lg on the bar itself, not overflow-hidden on the whole
          column - overflow-hidden would clip a card mid-drag the instant it
          moves past this column's edge, which is exactly what's supposed to
          happen when dragging it into a different column. */}
      <div className={cn("h-1.5 rounded-t-lg shrink-0", styles.bar)} />
      <div className="flex flex-col gap-3 p-2 flex-1">
        <div className="flex items-center justify-between px-1.5 pt-1 shrink-0">
          <Typography variant="small" className={cn("font-semibold", styles.label)}>
            {label}
          </Typography>
          <Typography variant="small" className={cn("font-medium", styles.label, "opacity-60")}>
            {applications.length}
          </Typography>
        </div>
        {/* flex-1, no overflow here - grows to match the tallest sibling
            column's natural content height (same stretch as the column
            itself), so an empty/short column's dashed box still fills that
            full shared height instead of stopping at a small fixed box. */}
        <div className="flex flex-col gap-2 flex-1">
          {applications.length === 0 ? (
          <div className="flex-1 flex items-center justify-center rounded-lg border border-dashed border-border/70 py-8 text-center">
            <Typography variant="small" className="text-muted-foreground/70">
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
 * cost of requiring a horizontal swipe to see every column. TouchSensor
 * uses a short press-and-hold delay (200ms) before a drag starts, so a
 * quick swipe still scrolls the row normally instead of every touch being
 * interpreted as a drag attempt - PointerSensor (mouse) keeps its
 * distance-based activation since a delay would feel laggy with a mouse,
 * which doesn't have this scroll-vs-drag ambiguity to begin with. Every
 * status change is also available from the detail panel's Listbox, so
 * touch users are never stuck even before they discover press-and-hold.
 */
export function KanbanBoard({ applications: initial, total: initialTotal }: { applications: ApplicationRowData[]; total: number }) {
  const [applications, setApplications] = useState(initial);
  const [total, setTotal] = useState(initialTotal);
  const [activeApp, setActiveApp] = useState<ApplicationRowData | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const hasMore = applications.length < total;

  async function handleLoadMore() {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const { data } = await loadMoreApplications(applications.length);
      setApplications((prev) => [...prev, ...data]);
    } catch {
      setLoadMoreError("Failed to load more applications. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

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
    setTotal((t) => Math.max(0, t - 1));
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
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

  const activeApplication = activeId ? applications.find((a) => a.id === activeId) ?? null : null;

  return (
    <>
      {/* autoScroll={false}: dnd-kit's default auto-scroll hunts for the
          nearest scrollable ancestor (here, the board's own
          horizontally-scrolling row below) and can trigger it mid-drag in
          ways that feel like the container randomly jumping/scrolling -
          this board is small enough that scroll-while-dragging isn't
          needed at all, so it's simplest to turn it off outright rather
          than fight its heuristics. */}
      <DndContext
        id="applications-kanban"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        autoScroll={false}
      >
        {/* overflow-auto (both axes) on THIS row, not per-column: columns
            stretch to match whichever has the most cards (flex default),
            and once that shared height exceeds max-h, the whole row
            scrolls as one unit - every column moves together instead of
            each having its own independent, out-of-sync scrollbar.
            min-h keeps columns a substantial height even when every
            column is sparse/empty (plain stretch alone would only
            equalize them to each other, not to any particular size). */}
        <div className="flex gap-4 overflow-auto pb-4 -mx-1 px-1 min-h-[420px] max-h-[min(70vh,700px)]">
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
        {/* Portals the dragged card to the document body (via React
            portal, outside the overflow-x-auto row above), so it's never
            clipped by that row's scroll container while being dragged
            across column boundaries - see ApplicationCard's doc comment. */}
        <DragOverlay>
          {activeApplication && (
            <Card className="p-3.5 w-60 shadow-lg cursor-grabbing">
              <ApplicationCardContent application={activeApplication} />
            </Card>
          )}
        </DragOverlay>
      </DndContext>
      {/* Columns only ever hold what's been loaded so far, not true
          per-status totals, once pagination is in play - this footer is
          what tells the user there's more beyond what the board currently
          shows. */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <Typography variant="small" className="text-muted-foreground">
          Showing {applications.length} of {total} application{total === 1 ? "" : "s"}
        </Typography>
        {hasMore && (
          <>
            {loadMoreError && (
              <Typography variant="small" className="text-destructive">
                {loadMoreError}
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
