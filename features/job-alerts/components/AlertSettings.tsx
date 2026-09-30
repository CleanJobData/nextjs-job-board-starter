"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Listbox } from "@/components/ui/Listbox";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { updateAlertSettings } from "../actions/alerts";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

export function AlertSettings({
  initialEnabled,
  initialFrequency,
}: {
  initialEnabled: boolean;
  initialFrequency: "daily" | "weekly";
}) {
  const [enabled, setEnabled] = React.useState(initialEnabled);
  const [frequency, setFrequency] = React.useState<"daily" | "weekly">(initialFrequency);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  const dirty = enabled !== initialEnabled || frequency !== initialFrequency;

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateAlertSettings({ enabled, frequency });
      setSaved(true);
    });
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div>
          <Typography variant="h4">Email alerts</Typography>
          <Typography variant="muted">
            Get new jobs matching the preferences above, sent to your inbox.
          </Typography>
        </div>

        <Switch checked={enabled} onChange={setEnabled} label="Email me new matching jobs" />

        {enabled && (
          <div className="space-y-1">
            <label className="text-sm font-medium">How often</label>
            <Listbox
              options={FREQUENCIES}
              value={frequency}
              onChange={(v) => setFrequency(v as "daily" | "weekly")}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
          {saved && !dirty && (
            <Typography variant="small" className="text-muted-foreground">
              Saved
            </Typography>
          )}
          <Button size="sm" disabled={!dirty || pending} onClick={save}>
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
