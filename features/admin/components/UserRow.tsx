"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { Listbox } from "@/components/ui/Listbox";
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

  function handleChange(next: string) {
    const prev = role;
    setRole(next as "user" | "admin");
    setError(null);
    startTransition(async () => {
      try {
        await setUserRole(user.id, next as "user" | "admin");
      } catch (err) {
        setRole(prev);
        setError(err instanceof Error ? err.message : "Failed to update role.");
      }
    });
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
    </Card>
  );
}
