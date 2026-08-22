import { notFound, redirect } from "next/navigation";
import { checkAccess } from "@/features/authGuard";
import JobPostingsPage from "@/features/job-posting/routes/job-postings/page";

export default async function Page() {
  const access = await checkAccess("jobPosting");
  if (access.status === "disabled") notFound();
  if (access.status === "needs-auth") redirect("/sign-in");
  return <JobPostingsPage />;
}
