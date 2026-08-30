import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./Typography";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * Reusable "nothing here yet" panel - a bare sentence of muted text reads as
 * unfinished, so this pairs an icon, a real heading, optional supporting
 * copy, and an optional call-to-action inside a dashed, centered panel.
 * Used wherever a list/collection can be legitimately empty (tracked
 * applications, job postings, etc) instead of each feature inventing its
 * own empty-state markup.
 */
function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
      )}
      <Typography variant="large">{title}</Typography>
      {description && (
        <Typography variant="muted" className="max-w-sm">
          {description}
        </Typography>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export { EmptyState };
