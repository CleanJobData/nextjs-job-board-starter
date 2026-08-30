import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/ui/PageContainer";
import { auth } from "@/features/auth/lib/auth";
import featuresConfig from "@/features.config";
import { OnboardingFlow } from "../../components/OnboardingFlow";

/**
 * Onboarding is a real, session-gated route rather than a step rendered
 * inside the sign-up card - sign-up now signs the new account in
 * (features/auth/actions/register.ts), so there IS a session here to gate
 * on, which is what made this possible.
 */
export default async function OnboardingPage() {
  if (!featuresConfig.onboarding.enabled) notFound();

  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  return (
    <PageContainer size="sm">
      <OnboardingFlow />
    </PageContainer>
  );
}
