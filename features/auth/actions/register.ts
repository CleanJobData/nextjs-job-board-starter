"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import authConfig from "@/features.config";
import { users } from "../db/schema";
import { signIn } from "../lib/auth";
import { sendVerificationEmail } from "../lib/verification";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type RegisterFieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export type RegisterState = {
  success?: boolean;
  /** True when emailVerification is on - UI should show "check your inbox" instead of signing in, since an unverified account can't sign in yet. */
  needsVerification?: boolean;
  /** True when the new account was signed in as part of registering - the form redirects straight to /onboarding rather than bouncing through /sign-in. */
  signedIn?: boolean;
  error?: string;
  fieldErrors?: RegisterFieldErrors;
};

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const fieldErrors: RegisterFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof RegisterFieldErrors;
      if (field) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const db = requireDb();

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists" } };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({ name, email, passwordHash });

  if (authConfig.auth.emailVerification) {
    await sendVerificationEmail(email);
    // Deliberately not signed in: authorize() rejects unverified accounts
    // when emailVerification is on, so attempting it here would just fail.
    return { success: true, needsVerification: true };
  }

  // Sign the new account in immediately rather than sending them to
  // /sign-in to retype the credentials they just chose. This is also what
  // makes a real /onboarding route possible at all - previously there was
  // no session straight after sign-up, which forced onboarding to be an
  // inline step inside the sign-up card, passing a raw userId around
  // instead of being able to gate on auth() like every other route.
  await signIn("credentials", { email, password, redirect: false });

  return { success: true, signedIn: true };
}
