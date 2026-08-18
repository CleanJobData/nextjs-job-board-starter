import { notFound } from "next/navigation";
import config from "@/features.config";
import SignInPage from "@/features/auth/routes/sign-in/page";

export default function Page() {
  if (!config.auth.enabled) notFound();
  return <SignInPage />;
}
