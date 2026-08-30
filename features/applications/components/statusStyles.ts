import type { ApplicationStatus } from "../actions/applications";

/**
 * One place mapping status -> its accent color, shared by the column
 * header dot, each card's left accent border, and the detail panel's
 * status indicator - so "what does interviewing look like" only has one
 * answer anywhere in this feature, not a slightly-different one per
 * component. Values are Tailwind classes built from existing tokens
 * (primary/accent/destructive/secondary/muted-foreground), never raw hex.
 */
export const STATUS_ACCENT: Record<ApplicationStatus, { dot: string; border: string }> = {
  saved: { dot: "bg-muted-foreground", border: "border-l-muted-foreground" },
  applied: { dot: "bg-primary", border: "border-l-primary" },
  interviewing: { dot: "bg-accent-foreground", border: "border-l-accent-foreground" },
  // warning (amber), not primary/accent - "offer" deserves a visually
  // distinct, celebratory accent of its own rather than sharing green with
  // applied/interviewing.
  offer: { dot: "bg-warning", border: "border-l-warning" },
  rejected: { dot: "bg-destructive", border: "border-l-destructive" },
  withdrawn: { dot: "bg-secondary-foreground/40", border: "border-l-secondary-foreground/40" },
};
