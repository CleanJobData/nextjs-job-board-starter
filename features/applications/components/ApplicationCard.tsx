"use client";

import { useDraggable } from "@dnd-kit/core";
import { FaNoteSticky } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import type { ApplicationRowData } from "./types";

/**
 * Compact, Notion-database-style card: title + company + a small metadata
 * line, no inline status control, no inline notes textarea (both moved to
 * ApplicationDetailPanel). Draggable via @dnd-kit's useDraggable; clicking
 * (not dragging) opens the detail panel via onOpen.
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(application.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className={cn(
        "p-3 flex flex-col gap-1.5 cursor-pointer select-none transition-shadow hover:shadow-md active:cursor-grabbing",
        isDragging && "opacity-50 z-10",
        pending && "opacity-70"
      )}
    >
      <Typography className="font-medium text-sm leading-snug line-clamp-2">
        {application.jobTitle}
      </Typography>
      {application.companyName && (
        <Typography variant="small" className="text-muted-foreground truncate">
          {application.companyName}
        </Typography>
      )}
      <div className="flex items-center justify-between gap-2 mt-1">
        <Typography variant="small" className="text-muted-foreground">
          {daysAgo === 0 ? "Updated today" : `${daysAgo}d ago`}
        </Typography>
        {application.notes && (
          <FaNoteSticky className="h-3 w-3 text-muted-foreground shrink-0" title="Has notes" />
        )}
      </div>
    </Card>
  );
}
