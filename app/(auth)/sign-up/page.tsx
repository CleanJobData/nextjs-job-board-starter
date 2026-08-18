import { notFound } from "next/navigation";
import config from "@/features.config";
import SignUpPage from "@/features/auth/routes/sign-up/page";

export default function Page() {
  if (!config.auth.enabled) notFound();
  return <SignUpPage />;
}
