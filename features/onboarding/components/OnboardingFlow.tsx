"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FaMagnifyingGlass, FaBuilding } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { cn } from "@/lib/utils";
import {
  RolesField,
  LocationFields,
  ExperienceFields,
  draftToPreferences,
  emptyPreferenceDraft,
  type PreferenceDraft,
} from "./PreferenceFields";
import { completeOnboarding } from "../actions/onboarding";

type AccountType = "seeker" | "employer";

/** Seekers step through role -> location -> experience one at a time; employers finish at step 1. */
const SEEKER_STEP_COUNT = 4;

/** Local copy of the shared Choice tile, used for the role step. */
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
        selected ? "border-primary bg-primary/10 text-foreground" : "border-border hover:border-foreground/20",
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
  const [step, setStep] = React.useState(1);
  const [accountType, setAccountType] = React.useState<AccountType | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const [draft, setDraft] = React.useState<PreferenceDraft>(emptyPreferenceDraft);

  const totalSteps = accountType === "employer" ? 1 : SEEKER_STEP_COUNT;
  const rolesEntered = draft.titles.trim().length > 0;

  function finish(type: AccountType) {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding({
          accountType: type,
          preferences: type === "seeker" ? draftToPreferences(draft) : null,
        });
        router.push(type === "employer" ? "/job-postings" : "/jobs");
        router.refresh();
      } catch (e: any) {
        setError(e?.message ?? "Something went wrong.");
      }
    });
  }

  const titleByStep: Record<number, string> = {
    1: "Welcome - what brings you here?",
    2: "What roles are you looking for?",
    3: "Where would you like to work?",
    4: "Any other preferences?",
  };
  const subtitleByStep: Record<number, string> = {
    1: "This tailors what you see. You can change it later.",
    2: "We'll use this to pre-filter your job feed.",
    3: "Pick as many locations as you like, or go remote-only.",
    4: "Nothing here is permanent - adjust it anytime from Preferences.",
  };

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="overline">Step {step} of {totalSteps}</Typography>
        <Typography variant="h1" className="text-3xl font-bold tracking-tight mt-1 mb-1">
          {titleByStep[step]}
        </Typography>
        <Typography className="text-muted-foreground">{subtitleByStep[step]}</Typography>
      </div>

      <Card>
        <CardContent className="p-5 space-y-6">
          {step === 1 && (
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
          )}
          {step === 2 && <RolesField draft={draft} onChange={setDraft} disabled={pending} />}
          {step === 3 && <LocationFields draft={draft} onChange={setDraft} disabled={pending} />}
          {step === 4 && <ExperienceFields draft={draft} onChange={setDraft} disabled={pending} />}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={pending}>
            Back
          </Button>
        )}
        {step === 1 && (
          <Button
            disabled={!accountType || pending}
            onClick={() => {
              if (accountType === "employer") finish("employer");
              else setStep(2);
            }}
          >
            Continue
          </Button>
        )}
        {step === 2 && (
          <Button disabled={!rolesEntered || pending} onClick={() => setStep(3)}>
            Continue
          </Button>
        )}
        {step === 3 && (
          <Button disabled={pending} onClick={() => setStep(4)}>
            Continue
          </Button>
        )}
        {step === 4 && (
          <Button disabled={pending} onClick={() => finish("seeker")}>
            {pending ? "Saving..." : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
