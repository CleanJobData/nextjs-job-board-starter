"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FaMagnifyingGlass, FaBuilding, FaCheck } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
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

/** Big, centered, icon-forward tile for the account-type question. */
function RoleTile({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col items-center gap-3 rounded-2xl border-2 px-6 py-10 text-center transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border hover:border-primary/40 hover:bg-muted/40"
      )}
    >
      {selected && (
        <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <FaCheck className="h-3 w-3" />
        </span>
      )}
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full text-2xl transition-colors",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70 group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        {icon}
      </span>
      <span className="text-lg font-semibold">{title}</span>
      <Typography variant="small" className="text-muted-foreground">
        {description}
      </Typography>
    </button>
  );
}

/**
 * A real multi-step flow on its own /onboarding route - not a panel inside
 * the sign-up card. Step 1 asks what kind of account this is; steps 2-4
 * (job seekers only) collect the search preferences that seed their feed,
 * one question at a time rather than one dense form. Employers finish at
 * step 1, since their equivalent setup is creating a company, which
 * job-posting already owns.
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
    1: "What brings you here?",
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
    <div className="mx-auto max-w-2xl space-y-10">
      <div className="space-y-2">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        <Typography variant="small" className="text-muted-foreground">
          Step {step} of {totalSteps}
        </Typography>
      </div>

      <div className="space-y-8">
        <div className={cn("space-y-2", step === 1 && "text-center")}>
          <Typography variant="h1" className="text-3xl sm:text-4xl font-bold tracking-tight">
            {titleByStep[step]}
          </Typography>
          <Typography className="text-muted-foreground text-lg">{subtitleByStep[step]}</Typography>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <RoleTile
              selected={accountType === "seeker"}
              onClick={() => setAccountType("seeker")}
              icon={<FaMagnifyingGlass />}
              title="I'm looking for a job"
              description="Browse and track applications."
            />
            <RoleTile
              selected={accountType === "employer"}
              onClick={() => setAccountType("employer")}
              icon={<FaBuilding />}
              title="I'm hiring"
              description="Post jobs and manage a company."
            />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <RolesField draft={draft} onChange={setDraft} disabled={pending} />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <LocationFields draft={draft} onChange={setDraft} disabled={pending} />
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <ExperienceFields draft={draft} onChange={setDraft} disabled={pending} />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        {step > 1 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)} disabled={pending}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step === 1 && (
          <Button
            size="lg"
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
          <Button size="lg" disabled={!rolesEntered || pending} onClick={() => setStep(3)}>
            Continue
          </Button>
        )}
        {step === 3 && (
          <Button size="lg" disabled={pending} onClick={() => setStep(4)}>
            Continue
          </Button>
        )}
        {step === 4 && (
          <Button size="lg" disabled={pending} onClick={() => finish("seeker")}>
            {pending ? "Saving..." : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
