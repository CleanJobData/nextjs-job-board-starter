import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { emailBrand } from "./brand";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CleanJobData";

/**
 * Shared wrapper every email template renders inside - keeps header/footer
 * branding consistent without every template repeating markup. Add new
 * templates under lib/email/templates/ and wrap them in this.
 */
export function EmailLayout({
  previewText,
  children,
}: {
  previewText: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: emailBrand.background, fontFamily: "sans-serif" }}>
        <Container style={{ maxWidth: 480, margin: "0 auto", padding: "32px 24px" }}>
          <Text style={{ fontSize: 18, fontWeight: 700, color: emailBrand.foreground }}>
            {siteName}
          </Text>
          <Section
            style={{
              backgroundColor: "#ffffff",
              border: `1px solid ${emailBrand.border}`,
              borderRadius: 12,
              padding: 24,
            }}
          >
            {children}
          </Section>
          <Text style={{ fontSize: 12, color: emailBrand.mutedForeground, marginTop: 16 }}>
            {siteName} - this is an automated message.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
