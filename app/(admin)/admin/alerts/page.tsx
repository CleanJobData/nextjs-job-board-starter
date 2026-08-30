import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/features/registry";
import { requireAdmin } from "@/features/authGuard";
import AdminAlertsPage from "@/features/admin/routes/admin/alerts/page";

export default async function Page() {
  if (!isFeatureEnabled("admin") || !isFeatureEnabled("jobAlerts")) notFound();
  const access = await requireAdmin();
  if (access.status !== "ok") notFound();
  return <AdminAlertsPage />;
}
