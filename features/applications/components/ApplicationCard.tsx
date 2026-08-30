"use client";

import { useDraggable } from "@dnd-kit/core";
import { FaNoteSticky } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { cn } from "@/lib/utils";
import type { ApplicationRowData } from "./types";

/**
 * The card's visual content only - no drag wiring. Shared by ApplicationCard
 * (the real, draggable in-column card) and KanbanBoard's DragOverlay (the
 * floating copy shown while dragging), so both render identically without
 * calling useDraggable twice for the same application id, which dnd-kit
 * doesn't support.
 */
export function ApplicationCardContent({ application }: { application: ApplicationRowData }) {
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5">
        {application.companyLogo && (
          <CompanyLogo
            src={application.companyLogo}
            className="h-6 w-6 rounded-md mt-0.5"
            iconClassName="h-3 w-3"
          />
        )}
        <div className="min-w-0 flex-1">
          <Typography className="font-medium text-sm leading-snug line-clamp-2">
            {application.jobTitle}
          </Typography>
          {application.companyName && (
            <Typography variant="small" className="text-muted-foreground/80 text-xs truncate">
              {application.companyName}
            </Typography>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Typography variant="small" className="text-muted-foreground/70">
          {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
        </Typography>
        {application.notes && (
          <FaNoteSticky className="h-3 w-3 text-muted-foreground/70 shrink-0" title="Has notes" />
        )}
      </div>
    </div>
  );
}

/**
 * Compact, Notion-database-style card - title, company, a quiet metadata
 * line. No inline status control, no inline notes textarea (both moved to
 * ApplicationDetailPanel). Deliberately minimal: no avatar, no colored
 * border - status is already unambiguous from which column the card sits
 * in, so repeating it as extra chrome on every card just adds visual noise
 * without adding information. Draggable via @dnd-kit's useDraggable;
 * clicking (not dragging) opens the detail panel via onOpen.
 *
 * Deliberately does NOT apply useDraggable's `transform` while dragging -
 * KanbanBoard renders the actual moving visual via <DragOverlay>, a
 * dnd-kit primitive that portals the dragged element to the document body,
 * escaping any ancestor's overflow/clipping. Without it, the horizontally-
 * scrolling board row below (overflow-x-auto) would clip a dragged card
 * the instant it crossed the column's edge - overflow-x-auto forces
 * overflow-y to also compute as clipping per the CSS spec, so this isn't
 * fixable by just tweaking one axis. This card just fades out in place
 * (isDragging) while DragOverlay shows the version that actually follows
 * the pointer.
 */
export function ApplicationCard({
  application,
  onOpen,
  pending,
}: {
  application: ApplicationRowData;
  onOpen: () => void;
  pending?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
  });

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className={cn(
        "p-3.5 cursor-grab select-none shadow-none",
        "transition-colors hover:border-foreground/20 active:cursor-grabbing",
        isDragging && "opacity-30",
        pending && "opacity-70"
      )}
    >
      <ApplicationCardContent application={application} />
    </Card>
  );
}
