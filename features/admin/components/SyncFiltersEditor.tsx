"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import type { SyncFilters } from "@/features/job-sync/job-sync.schema";
import { resetSyncFilters, updateSyncFilters } from "../actions/sync-settings";

/**
 * A raw-JSON editor, not a bespoke form per filter field - syncFiltersSchema
 * has 17 independent fields (see job-sync.schema.ts), most rarely used, and
 * this is a technical-operator surface (an admin who already knows what
 * these filters mean), not an end-user one. Validated server-side against
 * the exact same schema job-sync.config.ts itself is parsed with, so a
 * typo gets a real error instead of silently meaning "no filter applied".
 */
export function SyncFiltersEditor({
  override,
  codeDefault,
}: {
  override: SyncFilters | null;
  codeDefault: SyncFilters;
}) {
  const [value, setValue] = useState(() => JSON.stringify(override ?? codeDefault, null, 2));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateSyncFilters(value);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  function reset() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await resetSyncFilters();
        setValue(JSON.stringify(codeDefault, null, 2));
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reset.");
      }
    });
  }

  return (
    <Card className="p-5 space-y-3">
      <div>
        <Typography variant="h3">Sync filters</Typography>
        <Typography variant="small" className="text-muted-foreground">
          Which jobs get synced from CleanJobData into this deployment. Overrides{" "}
          <code className="rounded bg-muted px-1 py-0.5">job-sync.config.ts</code>&apos;s{" "}
          <code className="rounded bg-muted px-1 py-0.5">syncFilters</code> without a redeploy -
          {override ? " currently overridden below." : " not currently overridden; showing the code default below."}
        </Typography>
      </div>

      <Textarea
        rows={10}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        className="font-mono text-xs"
      />

      {error && (
        <Typography variant="small" className="text-destructive">
          {error}
        </Typography>
      )}

      <div className="flex items-center gap-3">
        {saved && !error && (
          <Typography variant="small" className="text-muted-foreground">
            Saved
          </Typography>
        )}
        <Button size="sm" disabled={pending} onClick={save}>
          {pending ? "Saving..." : "Save override"}
        </Button>
        {override && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={reset}>
            Reset to code default
          </Button>
        )}
      </div>
    </Card>
  );
}
