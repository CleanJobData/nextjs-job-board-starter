import { Button, Text } from "@react-email/components";
import { EmailLayout } from "./Layout";
import { emailBrand } from "./brand";

export function VerifyEmailTemplate({ verifyUrl }: { verifyUrl: string }) {
  return (
    <EmailLayout previewText="Verify your email address">
      <Text style={{ fontSize: 16, color: emailBrand.foreground }}>
        Confirm your email address to finish creating your account.
      </Text>
      <Button
        href={verifyUrl}
        style={{
          backgroundColor: emailBrand.primary,
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: 8,
          fontWeight: 600,
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        Verify email
      </Button>
      <Text style={{ fontSize: 12, color: emailBrand.mutedForeground, marginTop: 16 }}>
        If you didn&apos;t create an account, you can ignore this email. This link expires in 24 hours.
      </Text>
    </EmailLayout>
  );
}
