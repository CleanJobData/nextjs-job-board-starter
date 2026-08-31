import { notFound, redirect } from "next/navigation";
import { checkAccess } from "@/features/authGuard";
import ResumeEditPage from "@/features/resume/routes/resume-edit/page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const access = await checkAccess("resume");
  if (access.status === "disabled") notFound();
  if (access.status === "needs-auth") redirect("/sign-in");
  const { id } = await params;
  return <ResumeEditPage id={id} />;
}
