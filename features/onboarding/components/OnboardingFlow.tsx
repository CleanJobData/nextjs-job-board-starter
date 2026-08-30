"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FaMagnifyingGlass, FaBuilding } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { GeoSuggest } from "@/jobs/components/GeoSuggest";
import type { GeoSuggestResult } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { completeOnboarding, skipOnboarding } from "../actions/onboarding";

const EXPERIENCE_LEVELS = [
  { value: "EN", label: "Entry" },
  { value: "MI", label: "Mid" },
  { value: "SE", label: "Senior" },
  { value: "EX", label: "Executive" },
];

type AccountType = "seeker" | "employer";

/** One selectable tile - used for both the role choice and the experience-level toggles. */
function Choice({
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
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border hover:border-foreground/20",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * A real multi-step flow on its own /onboarding route - not a panel inside
 * the sign-up card. Step 1 asks what kind of account this is; step 2 (job
 * seekers only) collects the search preferences that seed their feed.
 * Employers finish at step 1, since their equivalent setup is creating a
 * company, which job-posting already owns.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [accountType, setAccountType] = React.useState<AccountType | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [titles, setTitles] = React.useState("");
  const [locations, setLocations] = React.useState<GeoSuggestResult[]>([]);
  const [remoteOnly, setRemoteOnly] = React.useState(false);
  const [levels, setLevels] = React.useState<string[]>([]);
  const [minSalary, setMinSalary] = React.useState("");

  function toggleLevel(value: string) {
    setLevels((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function finish(type: AccountType) {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          accountType: type,
          preferences:
            type === "seeker"
              ? {
                  titles: titles
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                  cityIds: locations.filter((l) => l.city_id != null).map((l) => l.city_id!),
                  stateIds: locations
                    .filter((l) => l.city_id == null && l.state_id != null)
                    .map((l) => l.state_id!),
                  countryIds: locations
                    .filter((l) => l.city_id == null && l.state_id == null && l.country_id != null)
                    .map((l) => l.country_id!),
                  remoteOnly,
                  experienceLevels: levels,
                  minSalary: minSalary ? Number(minSalary) : null,
                }
              : null,
        });
        router.push(type === "employer" ? "/job-postings" : "/jobs");
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong.");
      }
    });
  }

  function skip() {
    startTransition(async () => {
      try {
        await skipOnboarding();
        router.push("/jobs");
        router.refresh();
      } catch {
        router.push("/jobs");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="overline">Step {step} of {accountType === "employer" ? 1 : 2}</Typography>
        <Typography variant="h1" className="text-3xl font-bold tracking-tight mt-1 mb-1">
          {step === 1 ? "Welcome - what brings you here?" : "What are you looking for?"}
        </Typography>
        <Typography className="text-muted-foreground">
          {step === 1
            ? "This tailors what you see. You can change it later."
            : "We'll use these to pre-filter your job feed. Nothing here is permanent."}
        </Typography>
      </div>

      <Card>
        <CardContent className="p-5 space-y-6">
          {step === 1 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Choice
                selected={accountType === "seeker"}
                onClick={() => setAccountType("seeker")}
                className="flex items-start gap-3"
              >
                <FaMagnifyingGlass className="h-4 w-4 mt-1 shrink-0 text-primary" />
                <span className="min-w-0">
                  <Typography className="font-semibold">I'm looking for a job</Typography>
                  <Typography variant="small" className="text-muted-foreground">
                    Browse and track applications.
                  </Typography>
                </span>
              </Choice>
              <Choice
                selected={accountType === "employer"}
                onClick={() => setAccountType("employer")}
                className="flex items-start gap-3"
              >
                <FaBuilding className="h-4 w-4 mt-1 shrink-0 text-primary" />
                <span className="min-w-0">
                  <Typography className="font-semibold">I'm hiring</Typography>
                  <Typography variant="small" className="text-muted-foreground">
                    Post jobs and manage a company.
                  </Typography>
                </span>
              </Choice>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Roles you're interested in</label>
                <Input
                  value={titles}
                  onChange={(e) => setTitles(e.target.value)}
                  placeholder="Data engineer, product designer"
                  disabled={pending}
                />
                <Typography variant="small" className="text-muted-foreground">
                  Separate with commas.
                </Typography>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Preferred locations</label>
                <GeoSuggest selectedLocations={locations} onChange={setLocations} />
              </div>

              <Switch checked={remoteOnly} onChange={setRemoteOnly} label="Only show remote roles" />

              <div className="space-y-2">
                <label className="text-sm font-medium">Experience level</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((l) => (
                    <Choice
                      key={l.value}
                      selected={levels.includes(l.value)}
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
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="80000"
                  disabled={pending}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={skip} disabled={pending}>
          Skip for now
        </Button>
        <div className="flex items-center gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} disabled={pending}>
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button
              disabled={!accountType || pending}
              onClick={() => {
                if (accountType === "employer") finish("employer");
                else setStep(2);
              }}
            >
              Continue
            </Button>
          ) : (
            <Button disabled={pending} onClick={() => finish("seeker")}>
              {pending ? "Saving..." : "Finish"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
