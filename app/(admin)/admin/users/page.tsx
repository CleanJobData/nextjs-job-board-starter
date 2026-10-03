import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/features/registry";
import { requireAdmin } from "@/features/authGuard";
import AdminUsersPage from "@/features/admin/routes/admin/users/page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (!isFeatureEnabled("admin")) notFound();
  const access = await requireAdmin();
  if (access.status !== "ok") notFound();
  return <AdminUsersPage searchParams={searchParams} />;
}
