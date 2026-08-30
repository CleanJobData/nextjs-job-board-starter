import { notFound, redirect } from "next/navigation";
import { checkAccess } from "@/features/authGuard";
import ResumePage from "@/features/resume/routes/resume/page";

export default async function Page() {
  const access = await checkAccess("resume");
  if (access.status === "disabled") notFound();
  if (access.status === "needs-auth") redirect("/sign-in");
  return <ResumePage />;
}
