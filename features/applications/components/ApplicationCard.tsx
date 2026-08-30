"use client";

import { useDraggable } from "@dnd-kit/core";
import { FaNoteSticky } from "react-icons/fa6";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { cn } from "@/lib/utils";
import type { ApplicationRowData } from "./types";

/**
 * Compact, Notion-database-style card - title, company, a quiet metadata
 * line. No inline status control, no inline notes textarea (both moved to
 * ApplicationDetailPanel). Deliberately minimal: no avatar, no colored
 * border - status is already unambiguous from which column the card sits
 * in, so repeating it as extra chrome on every card just adds visual noise
 * without adding information. Draggable via @dnd-kit's useDraggable;
 * clicking (not dragging) opens the detail panel via onOpen.
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
        "p-3.5 flex flex-col gap-2 cursor-grab select-none shadow-none",
        "transition-colors hover:border-foreground/20 active:cursor-grabbing",
        isDragging && "opacity-50 z-10 shadow-md",
        pending && "opacity-70"
      )}
    >
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
    </Card>
  );
}
