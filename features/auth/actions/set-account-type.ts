"use server";

import { eq, and, isNull } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import config from "@/features.config";
import { users } from "../db/schema";

/**
 * Sets `accountType` for the user shown the onboarding step right after
 * sign-up (see SignUpForm.tsx). Takes a bare `userId` rather than going
 * through checkAccess()/auth() because there is no session yet at this
 * point - registerUser() does not auto sign-in the new account, it still
 * lands on /sign-in afterward - so this is intentionally the one write in
 * the app that isn't behind a session check.
 *
 * Two guards keep that acceptable for a field this low-stakes (see the
 * schema doc comment: accountType is never read by any access-control
 * logic, purely informational):
 *  - `isNull(users.accountType)` makes this a one-time, idempotent-ish
 *    write - once a value is set (by onboarding or a future admin tool),
 *    this action can never overwrite it, so it can't be used to flip an
 *    existing account's stored type.
 *  - It only ever fires from the sign-up page's own post-success render,
 *    scoped to the id just returned by registerUser() in the same request
 *    flow, not exposed as a general "set my account type" control anywhere
 *    else in the UI.
 * Residual risk: a crafted direct call with a guessed id could set
 * accountType on someone else's still-null row before they onboard
 * themselves. Accepted for this pass given the field carries no gating
 * weight - flagged here for whoever eventually wires accountType into
 * real logic, at which point this action needs real session-based auth.
 */
export async function setAccountType(userId: string, accountType: "seeker" | "employer"): Promise<void> {
  if (!config.onboarding.enabled) return;
  if (!userId) return;

  const db = requireDb();
  await db
    .update(users)
    .set({ accountType })
    .where(and(eq(users.id, userId), isNull(users.accountType)));
}
