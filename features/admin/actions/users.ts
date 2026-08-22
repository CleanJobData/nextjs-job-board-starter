"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { requireAdmin } from "@/features/authGuard";
import { users } from "@/features/auth/db/schema";

const ADMIN_USERS_PATH = "/admin/users";

/** Throws (not notFound()) - this is the action-layer half of admin gating; page shims handle the notFound() half. */
async function requireAdminSession() {
  const access = await requireAdmin();
  if (access.status !== "ok") {
    throw new Error("Admin access required.");
  }
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Admin access required.");
  }
  return userId;
}

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  role: "user" | "admin";
};

/** All users, for the admin users page - no pagination yet (v1, matches the other admin list views' simplicity). */
export async function listAllUsers(): Promise<AdminUserRow[]> {
  await requireAdminSession();
  const db = requireDb();
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role }).from(users);
}

/**
 * Flips a user's role. Self-demotion is blocked outright (not just
 * disabled in the UI) - an admin removing their own last admin grant could
 * lock the whole admin dashboard out with no in-app way back in;
 * scripts/promote-admin.ts remains the escape hatch if a real re-grant is
 * ever needed. Demoting a DIFFERENT admin is allowed (no "last admin"
 * check across the table - v1 doesn't try to prevent zero-admin states
 * caused by two admins demoting each other, matching the spec's "simplest
 * safe choice" framing: block self-demotion, nothing more).
 */
export async function setUserRole(targetUserId: string, role: "user" | "admin") {
  const currentUserId = await requireAdminSession();
  if (targetUserId === currentUserId) {
    throw new Error("You can't change your own admin role.");
  }

  const db = requireDb();
  await db.update(users).set({ role }).where(eq(users.id, targetUserId));

  revalidatePath(ADMIN_USERS_PATH);
}
