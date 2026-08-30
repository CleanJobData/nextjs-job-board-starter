"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, type RegisterState } from "../actions/register";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";
import config from "@/features.config";

const initialState: RegisterState = {};

export function SignUpForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  // Sign-up now signs the account in, so the only thing left to do on
  // success is move the user along to the real /onboarding route. The
  // account-type question used to be rendered inline right here, because
  // there was no session to gate a route with - that constraint is gone.
  useEffect(() => {
    if (state.success && state.signedIn) {
      router.push(config.onboarding.enabled ? "/onboarding" : "/jobs");
      router.refresh();
    }
  }, [state.success, state.signedIn, router]);

  if (state.success) {
    return (
      <div className="flex flex-col gap-2">
        <Typography className="font-medium text-foreground">
          {state.needsVerification ? "Check your inbox" : "Account created"}
        </Typography>
        <Typography variant="small" className="text-muted-foreground">
          {state.needsVerification
            ? "We sent a verification link to your email. Click it to activate your account, then sign in."
            : "Taking you to setup..."}
        </Typography>
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
