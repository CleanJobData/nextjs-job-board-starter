"use client";

import { useActionState } from "react";
import { registerUser, type RegisterState } from "../actions/register";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Typography } from "@/components/ui/Typography";

const initialState: RegisterState = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(registerUser, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && (
        <Typography variant="small" className="text-destructive">
          {state.error}
        </Typography>
      )}
      {state.success && (
        <Typography variant="small" className="text-primary">
          Account created — you can now sign in.
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
