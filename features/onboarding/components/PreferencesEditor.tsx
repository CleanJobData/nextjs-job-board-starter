"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import type { GeoSuggestResult } from "@/lib/api/types";
import { PreferenceFields, draftToPreferences, type PreferenceDraft } from "./PreferenceFields";
import { updatePreferences } from "../actions/onboarding";

/**
 * The same fields onboarding collects, editable afterward. Without this,
 * preferences were effectively write-once at sign-up - they shape the job
 * feed, so being unable to change them was a real dead end.
 */
export function PreferencesEditor({ initial }: { initial: PreferenceDraft }) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<PreferenceDraft>(initial);
  const [pending, startTransition] = React.useTransition();
  const [saved, setSaved] = React.useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  function save() {
    setSaved(false);
    startTransition(async () => {
      await updatePreferences(draftToPreferences(draft));
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-5 space-y-6">
        <div>
          <Typography variant="h4">Job preferences</Typography>
          <Typography variant="muted">
            These pre-filter your feed on /jobs. Any filter you set there still wins.
          </Typography>
        </div>

        <PreferenceFields draft={draft} onChange={setDraft} disabled={pending} />

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
