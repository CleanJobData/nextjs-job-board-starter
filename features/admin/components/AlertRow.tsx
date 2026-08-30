"use client";

import * as React from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TableCell, TableRow } from "@/components/ui/Table";
import { disableAlertForUser, type AdminAlertRow } from "../actions/alerts";

export function AlertRow({ row }: { row: AdminAlertRow }) {
  const [enabled, setEnabled] = React.useState(row.enabled);
  const [pending, startTransition] = React.useTransition();

  function disable() {
    setEnabled(false);
    startTransition(async () => {
      try {
        await disableAlertForUser(row.userId);
      } catch {
        setEnabled(true);
      }
    });
  }

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-0">
          <div className="font-medium truncate">{row.name || "(no name)"}</div>
          <div className="text-muted-foreground truncate">{row.email}</div>
        </div>
      </TableCell>
      <TableCell className="capitalize">{row.frequency}</TableCell>
      <TableCell>
        {row.lastSentAt ? new Date(row.lastSentAt).toLocaleDateString() : "Never"}
      </TableCell>
      <TableCell>
        <Badge variant={enabled ? "accent" : "secondary"}>{enabled ? "Active" : "Off"}</Badge>
      </TableCell>
      <TableCell className="text-right">
        {enabled && (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" disabled={pending}>
                Disable
              </Button>
            }
            title="Disable this alert?"
            description={`Stops digest emails to ${row.email}. They can turn alerts back on themselves from /preferences.`}
            confirmLabel="Disable"
            onConfirm={disable}
          />
        )}
      </TableCell>
    </TableRow>
  );
}
