import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { verifyEmailToken } from "../../lib/verification";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  const result = token && email ? await verifyEmailToken(email, token) : "invalid";

  const copy = {
    verified: {
      title: "Email verified",
      body: "Your email is confirmed. You can sign in now.",
    },
    expired: {
      title: "Link expired",
      body: "This verification link has expired. Sign up again to get a new one, or try signing in - you may already be verified.",
    },
    invalid: {
      title: "Invalid link",
      body: "This verification link isn't valid. Double-check the link from your email, or sign up again.",
    },
  }[result];

  return (
    <PageContainer size="sm">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Typography className="text-muted-foreground">{copy.body}</Typography>
          <Link href="/sign-in" className="text-primary font-medium text-sm">
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
