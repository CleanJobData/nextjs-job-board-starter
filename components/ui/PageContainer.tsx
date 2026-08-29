import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lives in components/ui/ (not components/layout/) because it's a content
 * primitive that pages compose *inside* the app shell - the same way pages
 * reach for Card or Typography - not app-shell chrome like SiteHeader/
 * SiteFooter, which own their own fixed-height/sticky layout concerns and
 * intentionally don't use this component.
 *
 * Centralizes the `container mx-auto px-4 py-N max-w-X` div that 13+ pages
 * used to hand-roll with small, accidental inconsistencies (px-10 on one
 * page, max-w-4xl vs max-w-3xl on siblings, py-16 vs py-12). `py` is fixed
 * rather than a prop: every page migrated to this component turned out to
 * want the same vertical rhythm once compared side by side, and one fewer
 * knob is a deliberate simplification for a template component - a page
 * with a genuinely different need can still override via `className`.
 */
const sizeClasses = {
  /** Narrow auth-style forms (sign-in/up, verify-email). */
  sm: "max-w-md",
  /** The dominant width across existing dashboard/list pages. */
  md: "max-w-3xl",
  /** Wider content, e.g. admin's sync-status table. */
  lg: "max-w-4xl",
  /** No max-w - page manages its own internal width (homepage, job detail). */
  full: "",
} as const;

export type PageContainerSize = keyof typeof sizeClasses;

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: PageContainerSize;
}

const PageContainer = React.forwardRef<HTMLDivElement, PageContainerProps>(
  ({ className, size = "md", ...props }, ref) => (
    <div
      ref={ref}
      className={cn("container mx-auto px-4 py-12", sizeClasses[size], className)}
      {...props}
    />
  )
);
PageContainer.displayName = "PageContainer";

export { PageContainer };
