"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Listbox } from "@/components/ui/Listbox";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { AdminUserRow } from "../actions/users";
import { setUserRole } from "../actions/users";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

/** `isSelf` disables the role dropdown outright - setUserRole() also rejects self-demotion server-side, but disabling it here avoids a pointless round-trip and a confusing error toast for the one row it can never apply to. */
export function UserRow({ user, isSelf }: { user: AdminUserRow; isSelf: boolean }) {
  const [role, setRole] = useState(user.role);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Only promoting to admin is gated behind a confirmation - it's the
  // direction that actually grants access (moderation queue, other users'
  // roles), so a stray click has real consequences. Demoting back to
  // "user" merely revokes access and is trivially reversible by any other
  // admin, so it doesn't need the extra step - Listbox fires its onChange
  // immediately on selection (unlike a plain button), which is why this
  // needs its own confirm-then-commit state rather than reusing
  // ConfirmDialog's trigger-wrapping API.
  const [confirmingAdmin, setConfirmingAdmin] = useState(false);

  function applyRoleChange(next: "user" | "admin") {
    const prev = role;
    setRole(next);
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(user.id, next);
      } catch (err) {
        setRole(prev);
        setError(err instanceof Error ? err.message : "Failed to update role.");
      }
    });
  }

  function handleChange(next: string) {
    if (next === "admin") {
      setConfirmingAdmin(true);
      return;
    }
    applyRoleChange(next as "user" | "admin");
  }

  return (
    // flex-col sm:flex-row: name+email is a two-line, often-long block
    // (real emails routinely run 25-35+ chars) sitting next to a 144px-wide
    // role picker - side-by-side on a narrow phone forces the email into a
    // truncated sliver, hiding exactly the field an admin needs to read to
    // confirm they're changing the right user's role. Stacking gives the
    // email its own full-width line below sm, then reverts to a compact row
    // once there's room.
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <Typography className="font-medium truncate">{user.name || "(no name)"}</Typography>
        <Typography variant="small" className="text-muted-foreground truncate">
          {user.email}
        </Typography>
        {error && (
          <Typography variant="small" className="text-destructive">
            {error}
          </Typography>
        )}
      </div>
      <div className="w-full sm:w-36 shrink-0">
        {isSelf ? (
          <Typography variant="small" className="text-muted-foreground text-right">
            {user.role} (you)
          </Typography>
        ) : (
          <Listbox
            options={ROLE_OPTIONS}
            value={role}
            onChange={handleChange}
          />
        )}
        {!isSelf && pending && (
          <Typography variant="small" className="text-muted-foreground text-right">
            Saving...
          </Typography>
        )}
      </div>
      <Dialog
        isOpen={confirmingAdmin}
        onClose={() => setConfirmingAdmin(false)}
        title="Grant admin access?"
      >
        <Typography variant="muted" className="mb-6">
          {user.email} will be able to manage every user&apos;s role and moderate every job
          posting. Only do this for someone you trust with full admin access.
        </Typography>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmingAdmin(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmingAdmin(false);
              applyRoleChange("admin");
            }}
          >
            Grant Admin
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
