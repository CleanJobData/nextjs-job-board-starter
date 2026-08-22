import { notFound } from "next/navigation";
import { isFeatureEnabled } from "@/features/registry";
import { requireAdmin } from "@/features/authGuard";
import AdminPostingsPage from "@/features/admin/routes/admin/postings/page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!isFeatureEnabled("admin")) notFound();
  const access = await requireAdmin();
  if (access.status !== "ok") notFound();
  return <AdminPostingsPage searchParams={searchParams} />;
}
