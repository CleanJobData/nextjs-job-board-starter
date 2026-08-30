import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

export type DigestJob = {
  id: string;
  title: string;
  companyName: string | null;
  location: string | null;
  url: string;
};

/**
 * Plain, inline-styled markup on purpose - email clients don't reliably
 * support external stylesheets, CSS variables, or the app's Tailwind
 * tokens, so this template can't share the in-app design system and
 * deliberately doesn't try to.
 */
export function JobDigestTemplate({
  jobs,
  browseUrl,
  preferencesUrl,
}: {
  jobs: DigestJob[];
  browseUrl: string;
  preferencesUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{`${jobs.length} new job${jobs.length === 1 ? "" : "s"} matching your preferences`}</Preview>
      <Body style={{ backgroundColor: "#f6f6f6", fontFamily: "Arial, sans-serif", margin: 0, padding: "24px" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "8px", padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ fontSize: "20px", margin: "0 0 4px" }}>
            {jobs.length} new job{jobs.length === 1 ? "" : "s"} for you
          </Heading>
          <Text style={{ color: "#666666", fontSize: "14px", margin: "0 0 20px" }}>
            Based on the preferences saved to your account.
          </Text>

          {jobs.map((job) => (
            <Section key={job.id} style={{ marginBottom: "16px" }}>
              <Link href={job.url} style={{ color: "#111111", fontSize: "16px", fontWeight: "bold", textDecoration: "none" }}>
                {job.title}
              </Link>
              <Text style={{ color: "#666666", fontSize: "13px", margin: "2px 0 0" }}>
                {[job.companyName, job.location].filter(Boolean).join(" - ")}
              </Text>
            </Section>
          ))}

          <Hr style={{ borderColor: "#eeeeee", margin: "20px 0" }} />

          <Text style={{ fontSize: "13px", margin: "0 0 8px" }}>
            <Link href={browseUrl} style={{ color: "#10b981" }}>
              Browse all jobs
            </Link>
          </Text>
          <Text style={{ color: "#999999", fontSize: "12px", margin: 0 }}>
            <Link href={preferencesUrl} style={{ color: "#999999" }}>
              Update your preferences or turn these emails off
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
