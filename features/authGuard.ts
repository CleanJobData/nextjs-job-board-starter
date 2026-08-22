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

/**
 * Session + `role === "admin"` check for the phase 3 admin dashboard to
 * gate its routes/actions with. Deliberately not folded into
 * checkAccess()'s three-way shape - admin-gating isn't a per-feature
 * enabled/guestAccess toggle, it's "is this specific user an admin",
 * orthogonal to whether any feature is on.
 *
 * Queries `role` straight from the users table rather than trusting a
 * `role` claim on the JWT session token - the session callback in
 * features/auth/lib/auth.ts doesn't currently carry `role` at all, and
 * even if it did, a long-lived JWT session could still reflect a
 * since-revoked admin grant. This is only used for admin-only pages/
 * actions, not on every request, so the extra query is cheap where it
 * matters.
 *
 * Just the auth primitive - no routes/UI here, that's phase 3's job.
 */
export async function requireAdmin(): Promise<AccessResult> {
  const { auth } = await import("@/features/auth/lib/auth");
  const session = await auth();
  if (!session?.user?.id) return { status: "needs-auth" };

  const { requireDb } = await import("@/lib/db/client");
  const { users } = await import("@/features/auth/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = requireDb();
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id)).limit(1);

  return user?.role === "admin" ? { status: "ok" } : { status: "disabled" };
}
