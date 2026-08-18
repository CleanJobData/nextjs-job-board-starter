import config from "@/features.config";
import type { FeatureKey } from "@/features.schema";

export type AccessResult =
  | { status: "disabled" }
  | { status: "needs-auth" }
  | { status: "ok" };

/**
 * Centralizes the "is this feature on? does it need a signed-in user? is
 * one present?" check so every route shim / server action calls one
 * function instead of re-deriving the three-way branch. Called from both
 * page shims (app/(dashboard)/...) and feature server actions, so guests
 * can't bypass a guestAccess:false feature by hitting an action directly.
 *
 * Lazily imports auth() so this file has zero cost when auth isn't built
 * yet - only features/auth/lib/auth.ts (once it exists) pulls in NextAuth.
 */
export async function checkAccess(key: FeatureKey): Promise<AccessResult> {
  const feature = config[key];
  if (!feature.enabled) return { status: "disabled" };

  const guestAccess = "guestAccess" in feature ? feature.guestAccess : false;
  if (guestAccess || !config.auth.enabled) return { status: "ok" };

  const { auth } = await import("@/features/auth/lib/auth");
  const session = await auth();
  return session?.user ? { status: "ok" } : { status: "needs-auth" };
}
