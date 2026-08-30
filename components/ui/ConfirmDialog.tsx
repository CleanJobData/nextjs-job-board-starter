"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

interface ConfirmDialogProps {
  /** The element that opens the dialog - typically a Button. Cloned with an onClick that opens the dialog instead of whatever it already does, so callers don't need to manage open state themselves. */
  trigger: React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** destructive by default - this component exists specifically for actions the user asked to gate behind a confirmation (delete/reject/role-change), and "destructive" is the right visual weight for that class of action unless a caller overrides it. */
  confirmVariant?: ButtonProps["variant"];
  /** Called only on explicit confirmation. May be async (e.g. a server action) - the dialog shows a pending state and stays open until it resolves, then closes. Throwing leaves the dialog open so the caller can surface an error however it likes (the error itself isn't handled here - this component's job is the confirm gate, not error UI). */
  onConfirm: () => void | Promise<void>;
}

/**
 * A reusable "are you sure?" gate for destructive/hard-to-reverse actions
 * (delete an application, reject a job posting, change someone's admin
 * role) - added because several of these actions fire immediately on a
 * single click with no confirmation step, which is an easy way to lose
 * data or grant/revoke access by accident. Wrap the existing trigger
 * button in this instead of changing the action's own click handler -
 * keeps the confirm-gating logic in one place rather than hand-rolling a
 * dialog per call site.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          trigger.props.onClick?.(e);
          setIsOpen(true);
        },
      })}
      <Dialog isOpen={isOpen} onClose={() => !pending && setIsOpen(false)} title={title}>
        <Typography variant="muted" className="mb-6">
          {description}
        </Typography>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm} disabled={pending}>
            {pending ? "Working..." : confirmLabel}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
