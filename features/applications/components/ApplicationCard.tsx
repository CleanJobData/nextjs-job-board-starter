"use client";

import { useDraggable } from "@dnd-kit/core";
import { FaNoteSticky } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import { STATUS_ACCENT } from "./statusStyles";
import type { ApplicationRowData } from "./types";

/** First letter of the company name (or "?" if none) for the avatar badge - cheap, no logo data available on a tracked application's own snapshot fields. */
function initial(name: string | null) {
  return name?.trim()?.[0]?.toUpperCase() ?? "?";
}

/**
 * Compact, Notion-database-style card: title + company + a small metadata
 * footer, no inline status control, no inline notes textarea (both moved to
 * ApplicationDetailPanel). Draggable via @dnd-kit's useDraggable; clicking
 * (not dragging) opens the detail panel via onOpen.
 *
 * The left accent border repeats the same status color as the column dot -
 * redundant with column position while sitting in its own column, but it
 * keeps reading correctly the instant a card is mid-drag over a different
 * column (or, later, if this card ever renders somewhere other than its
 * own column) instead of the color only being implied by context.
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
        "group p-0 overflow-hidden cursor-pointer select-none border-l-[3px] shadow-sm",
        "transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
        "active:cursor-grabbing active:translate-y-0 active:shadow-sm",
        STATUS_ACCENT[application.status].border,
        isDragging && "opacity-50 z-10 rotate-1 shadow-lg",
        pending && "opacity-70"
      )}
    >
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
            {initial(application.companyName)}
          </div>
          <div className="min-w-0">
            <Typography className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {application.jobTitle}
            </Typography>
            {application.companyName && (
              <Typography variant="small" className="text-muted-foreground truncate">
                {application.companyName}
              </Typography>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/60">
          <Typography variant="small" className="text-muted-foreground">
            {daysAgo === 0 ? "Updated today" : `${daysAgo}d ago`}
          </Typography>
          {application.notes && (
            <FaNoteSticky
              className="h-3 w-3 text-muted-foreground shrink-0"
              title="Has notes"
            />
          )}
        </div>
      </div>
    </Card>
  );
}
