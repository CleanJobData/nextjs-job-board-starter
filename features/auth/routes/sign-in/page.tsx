import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { PageContainer } from "@/components/ui/PageContainer";
import { SignInForm } from "../../components/SignInForm";

export default function SignInPage() {
  return (
    <PageContainer size="sm">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignInForm />
          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-primary font-medium">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
