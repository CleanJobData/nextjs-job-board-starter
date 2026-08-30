"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { users, userPreferences } from "@/features/auth/db/schema";
import featuresConfig from "@/features.config";

async function requireUserId(): Promise<string> {
  if (!featuresConfig.onboarding.enabled) {
    throw new Error("Onboarding is disabled.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

export type OnboardingPreferences = {
  titles: string[];
  cityIds: number[];
  stateIds: number[];
  countryIds: number[];
  remoteOnly: boolean;
  experienceLevels: string[];
  minSalary: number | null;
};

/**
 * Completes onboarding: records the account type, saves a seeker's search
 * preferences, and stamps `onboardedAt` so the user isn't routed back here
 * on every future sign-in.
 *
 * `onboardedAt` is stamped even when the user skips - "I chose not to
 * answer" and "I answered" both mean onboarding is done. Only a genuinely
 * new account should ever land here, so the flag tracks *seen*, not
 * *completed*.
 */
export async function completeOnboarding(input: {
  accountType: "seeker" | "employer";
  preferences?: OnboardingPreferences | null;
}) {
  const userId = await requireUserId();
  const db = requireDb();

  await db
    .update(users)
    .set({ accountType: input.accountType, onboardedAt: new Date() })
    .where(eq(users.id, userId));

  // Employers get no search preferences - the fields are seeker-specific
  // (what jobs do you want to see), and an employer's equivalent concern is
  // their company profile, which job-posting already owns.
  if (input.accountType === "seeker" && input.preferences) {
    const row = { userId, ...input.preferences, updatedAt: new Date() };
    await db
      .insert(userPreferences)
      .values(row)
      .onConflictDoUpdate({ target: userPreferences.userId, set: row });
  }

  revalidatePath("/jobs");
}

/** Marks onboarding seen without recording anything - the "Skip" path. */
export async function skipOnboarding() {
  const userId = await requireUserId();
  const db = requireDb();
  await db.update(users).set({ onboardedAt: new Date() }).where(eq(users.id, userId));
}
