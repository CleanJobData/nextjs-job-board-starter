"use client";

import * as React from "react";
import { FaCircleInfo } from "react-icons/fa6";
import { Dialog } from "@/components/ui/Dialog";
import { Typography } from "@/components/ui/Typography";

/**
 * Placed next to the label of any field that renders through
 * lib/markdown.ts. Says so in plain text (not just an icon) and opens a
 * real dialog with the syntax it accepts, rather than a hover-away popover
 * - this is the kind of thing a user needs to actually read once, not a
 * fleeting hint.
 */
export function MarkdownHelp() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <FaCircleInfo className="h-3 w-3" />
        Markdown supported
      </button>

      <Dialog isOpen={open} onClose={() => setOpen(false)} title="Markdown supported" className="max-w-sm">
        <div className="space-y-3">
          <Typography variant="muted">
            This field accepts a few basic markdown formatting rules:
          </Typography>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <code>{"# Heading"}</code>
              <span className="text-muted-foreground">Title</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <code>{"- item"}</code>
              <span className="text-muted-foreground">Bullet point</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2">
              <code>{"[text](url)"}</code>
              <span className="text-muted-foreground">Link</span>
            </div>
          </div>
          <Typography variant="small" className="text-muted-foreground">
            Each rule goes on its own line. Anything else is shown as plain text.
          </Typography>
        </div>
      </Dialog>
    </>
  );
}
