import { notFound, redirect } from "next/navigation";
import { checkAccess } from "@/features/authGuard";
import ApplicationsPage from "@/features/applications/routes/applications/page";

export default async function Page() {
  const access = await checkAccess("applications");
  if (access.status === "disabled") notFound();
  if (access.status === "needs-auth") redirect("/sign-in");
  return <ApplicationsPage />;
}
