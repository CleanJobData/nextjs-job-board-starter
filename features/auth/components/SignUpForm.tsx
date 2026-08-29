"use client";

import { useState, useTransition } from "react";
import { useActionState } from "react";
import { registerUser, type RegisterState } from "../actions/register";
import { setAccountType } from "../actions/set-account-type";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import config from "@/features.config";

const initialState: RegisterState = {};

/**
 * Shown inline after a successful sign-up, in place of the plain "you can
 * now sign in" message, when onboarding.enabled - not as a separate routed
 * page. Sign-up here does not auto sign-in the new account (see
 * registerUser's doc comment), so there is no session for a dedicated
 * /onboarding route to gate with checkAccess() against; folding the choice
 * into this same client component's post-success render is the simplest
 * way to capture it while the just-created user's id is still in scope,
 * matching the user's explicit "keep it simple" ask over building a full
 * feature module for a single yes/no-ish question.
 */
function AccountTypeStep({ userId }: { userId: string }) {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const choose = (accountType: "seeker" | "employer") => {
    startTransition(async () => {
      await setAccountType(userId, accountType);
      setDone(true);
    });
  };

  if (done) {
    return (
      <Typography variant="small" className="text-muted-foreground">
        You can now sign in.
      </Typography>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Typography className="font-medium text-foreground">I&apos;m a...</Typography>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" disabled={pending} onClick={() => choose("seeker")} className="flex-1">
          Job Seeker
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => choose("employer")} className="flex-1">
          Employer
        </Button>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => setDone(true)}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline text-center disabled:opacity-50"
      >
        Skip for now
      </button>
    </div>
  );
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  if (state.success) {
    return (
      <div className="flex flex-col gap-2">
        <Typography className="font-medium text-foreground">
          {state.needsVerification ? "Check your inbox" : "Account created"}
        </Typography>
        {state.needsVerification && (
          <Typography variant="small" className="text-muted-foreground">
            We sent a verification link to your email. Click it to activate your account, then sign in.
          </Typography>
        )}
        {!state.needsVerification &&
          (config.onboarding.enabled && state.userId ? (
            <AccountTypeStep userId={state.userId} />
          ) : (
            <Typography variant="small" className="text-muted-foreground">
              You can now sign in.
            </Typography>
          ))}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Typography variant="small" className="text-destructive">
          {state.error}
        </Typography>
      )}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name
        </label>
        <Input id="name" name="name" type="text" autoComplete="name" required />
        {state.fieldErrors?.name && (
          <Typography variant="small" className="text-destructive">
            {state.fieldErrors.name}
          </Typography>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email && (
          <Typography variant="small" className="text-destructive">
            {state.fieldErrors.email}
          </Typography>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        {state.fieldErrors?.password && (
          <Typography variant="small" className="text-destructive">
            {state.fieldErrors.password}
          </Typography>
        )}
      </div>
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
