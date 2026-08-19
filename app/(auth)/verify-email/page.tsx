import { notFound } from "next/navigation";
import config from "@/features.config";
import VerifyEmailPage from "@/features/auth/routes/verify-email/page";

export default function Page(props: { searchParams: Promise<{ token?: string; email?: string }> }) {
  if (!config.auth.enabled || !config.auth.emailVerification) notFound();
  return <VerifyEmailPage {...props} />;
}
