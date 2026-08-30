"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { updateAlertSettings, type AlertSettingsInput } from "../actions/alerts";

/** Operator controls for how much mail leaves the domain per cron run - see alertSettings' schema doc comment for why these are runtime-editable rather than config-file constants. */
export function AlertSettingsForm({ initial }: { initial: AlertSettingsInput }) {
  const [draft, setDraft] = React.useState<AlertSettingsInput>(initial);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const set = <K extends keyof AlertSettingsInput>(k: K, v: AlertSettingsInput[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updateAlertSettings(draft);
      setSaved(true);
    });
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div>
          <Typography variant="h4">Sending controls</Typography>
          <Typography variant="muted">
            Applied on the next cron run. Lower the batch size or pause entirely if the sending
            domain starts getting throttled.
          </Typography>
        </div>

        <Switch
          checked={draft.paused}
          onChange={(v) => set("paused", v)}
          label="Pause all alert emails"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Max emails per run</label>
            <Input
              type="number"
              value={draft.maxEmailsPerRun}
              onChange={(e) => set("maxEmailsPerRun", Number(e.target.value))}
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Delay between sends (ms)</label>
            <Input
              type="number"
              value={draft.delayBetweenSendsMs}
              onChange={(e) => set("delayBetweenSendsMs", Number(e.target.value))}
              disabled={pending}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Jobs per digest</label>
            <Input
              type="number"
              value={draft.maxJobsPerDigest}
              onChange={(e) => set("maxJobsPerDigest", Number(e.target.value))}
              disabled={pending}
            />
          </div>
        </div>

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
