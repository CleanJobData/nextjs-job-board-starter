import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { auth } from "@/features/auth/lib/auth";
import { getUserApplications } from "../../lib/queries";
import { ApplicationsList } from "../../components/ApplicationsList";

export default async function ApplicationsPage() {
  const session = await auth();
  // The app/(dashboard)/applications shim already redirects to /sign-in when
  // there's no session (guestAccess is hard-locked false for this feature),
  // so reaching here with no session shouldn't normally happen - this is a
  // defensive fallback, not the primary guard.
  const userId = session?.user?.id;
  const applications = userId ? await getUserApplications(userId) : [];

  return (
    <PageContainer size="full">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">My Applications</Typography>
        <Typography className="text-muted-foreground">
          Track the jobs you&apos;ve saved and applied to.
        </Typography>
      </div>
      <ApplicationsList applications={applications} />
    </PageContainer>
  );
}
