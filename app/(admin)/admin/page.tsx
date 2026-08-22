import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/features/registry";
import { requireAdmin } from "@/features/authGuard";
import AdminHomePage from "@/features/admin/routes/admin/page";

/**
 * notFound() for BOTH "feature disabled" and "not an admin" (including
 * signed-out and signed-in-but-not-admin) - never a 403 or a redirect to
 * sign-in, which would leak "an admin section exists" to anyone probing
 * the URL. Matches app/(dashboard)/applications/page.tsx's and job-posting's
 * shim pattern of notFound()-on-disabled; requireAdmin() (role-based, not
 * checkAccess()'s feature-flag three-way) is the right primitive here since
 * admin gating is orthogonal to any per-feature guest/auth toggle.
 */
export default async function Page() {
  if (!isFeatureEnabled("admin")) notFound();
  const access = await requireAdmin();
  if (access.status !== "ok") notFound();
  return <AdminHomePage />;
}
