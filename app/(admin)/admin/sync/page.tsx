import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/features/registry";
import { requireAdmin } from "@/features/authGuard";
import AdminSyncPage from "@/features/admin/routes/admin/sync/page";

export default async function Page() {
  if (!isFeatureEnabled("admin")) notFound();
  const access = await requireAdmin();
  if (access.status !== "ok") notFound();
  return <AdminSyncPage />;
}
