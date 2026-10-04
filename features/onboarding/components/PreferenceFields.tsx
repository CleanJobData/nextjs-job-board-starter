"use client";

import * as React from "react";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { GeoSuggest } from "@/jobs/components/GeoSuggest";
import type { GeoSuggestResult } from "@/lib/api/types";
import { cn } from "@/lib/utils";

export const EXPERIENCE_LEVELS = [
  { value: "EN", label: "Entry" },
  { value: "MI", label: "Mid" },
  { value: "SE", label: "Senior" },
  { value: "EX", label: "Executive" },
];

export type PreferenceDraft = {
  titles: string;
  locations: GeoSuggestResult[];
  remoteOnly: boolean;
  levels: string[];
  minSalary: string;
};

export const emptyPreferenceDraft: PreferenceDraft = {
  titles: "",
  locations: [],
  remoteOnly: false,
  levels: [],
  minSalary: "",
};

/** Maps the form's draft shape onto what completeOnboarding/updatePreferences persist. */
export function draftToPreferences(draft: PreferenceDraft) {
  return {
    titles: draft.titles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    locations: draft.locations,
    remoteOnly: draft.remoteOnly,
    experienceLevels: draft.levels,
    minSalary: draft.minSalary ? Number(draft.minSalary) : null,
  };
}

export function Choice({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border px-4 py-3 text-left transition-colors",
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-foreground/20",
        className
      )}
    >
      {children}
    </button>
  );
}

type FieldGroupProps = {
  draft: PreferenceDraft;
  onChange: (next: PreferenceDraft) => void;
  disabled?: boolean;
};

function useSetter({ draft, onChange }: FieldGroupProps) {
  return <K extends keyof PreferenceDraft>(key: K, value: PreferenceDraft[K]) =>
    onChange({ ...draft, [key]: value });
}

/** Roles-only group - also used standalone as onboarding's first preference step. */
export function RolesField({ draft, onChange, disabled }: FieldGroupProps) {
  const set = useSetter({ draft, onChange, disabled });
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Roles you&apos;re interested in</label>
      <Input
        value={draft.titles}
        onChange={(e) => set("titles", e.target.value)}
        placeholder="Data engineer, product designer"
        disabled={disabled}
      />
      <Typography variant="small" className="text-muted-foreground">
        Separate with commas.
      </Typography>
    </div>
  );
}

/** Location + remote-only group - also used standalone as onboarding's second preference step. */
export function LocationFields({ draft, onChange }: FieldGroupProps) {
  const set = useSetter({ draft, onChange });
  return (
    <>
      <div className="space-y-1">
        <label className="text-sm font-medium">Preferred locations</label>
        <GeoSuggest
          selectedLocations={draft.locations}
          onChange={(locations) => set("locations", locations)}
        />
      </div>

      <Switch
        checked={draft.remoteOnly}
        onChange={(v) => set("remoteOnly", v)}
        label="Only show remote roles"
      />
    </>
  );
}

/** Experience level + minimum salary group - also used standalone as onboarding's third preference step. */
export function ExperienceFields({ draft, onChange, disabled }: FieldGroupProps) {
  const set = useSetter({ draft, onChange });

  function toggleLevel(value: string) {
    set(
      "levels",
      draft.levels.includes(value)
        ? draft.levels.filter((v) => v !== value)
        : [...draft.levels, value]
    );
  }

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Experience level</label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((l) => (
            <Choice
              key={l.value}
              selected={draft.levels.includes(l.value)}
              onClick={() => toggleLevel(l.value)}
              className="py-2 text-sm"
            >
              {l.label}
            </Choice>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Minimum salary</label>
        <Input
          type="number"
          value={draft.minSalary}
          onChange={(e) => set("minSalary", e.target.value)}
          placeholder="80000"
          disabled={disabled}
        />
      </div>
    </>
  );
}

/**
 * The full search-preference form, used by the /preferences editor as one
 * page. /onboarding instead renders RolesField/LocationFields/
 * ExperienceFields one at a time across its own steps - same underlying
 * fields, so the two can't drift into asking the same question two
 * different ways, just presented densely here vs. spread out there.
 */
export function PreferenceFields({ draft, onChange, disabled }: FieldGroupProps) {
  return (
    <>
      <RolesField draft={draft} onChange={onChange} disabled={disabled} />
      <LocationFields draft={draft} onChange={onChange} disabled={disabled} />
      <ExperienceFields draft={draft} onChange={onChange} disabled={disabled} />
    </>
  );
}
