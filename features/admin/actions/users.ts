"use server";

import { revalidatePath } from "next/cache";
import { count, eq, or, ilike } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { requireAdmin } from "@/features/authGuard";
import { users } from "@/features/auth/db/schema";

const ADMIN_USERS_PATH = "/admin/users";
const ADMIN_USERS_PAGE_SIZE = 20;

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

/**
 * Users for the admin users page, optionally name/email-matching `q`
 * (case-insensitive substring), paginated (offset/limit) - loading every
 * signup unconditionally was fine at zero users, not at any real volume.
 */
export async function listAllUsers(
  { q, limit = ADMIN_USERS_PAGE_SIZE, offset = 0 }: { q?: string; limit?: number; offset?: number } = {}
): Promise<{ data: AdminUserRow[]; total: number }> {
  await requireAdminSession();
  const db = requireDb();

  const search = q?.trim();
  const where = search ? or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)) : undefined;

  const [rows, totalRows] = await Promise.all([
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(where)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return { data: rows, total: totalRows[0]?.total ?? 0 };
}

/** Powers the users page's "Load more" button. */
export async function loadMoreUsers(q: string | undefined, offset: number) {
  return listAllUsers({ q, offset });
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
