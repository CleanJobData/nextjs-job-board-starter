import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import featuresConfig from "@/features.config";

/**
 * "Tools" link targets, each feature-gated the same way SiteHeader.tsx
 * gates its nav - a disabled feature's link must not render at all, not
 * render-and-404. Resume's two entries deep-link into the actual action
 * (ResumeManager.tsx reads `?action=`) rather than landing on a bare
 * list page a first-time visitor would have to figure out themselves.
 */
function getToolLinks() {
  const links: { label: string; href: string }[] = [{ label: "Browse Jobs", href: "/jobs" }];
  if (featuresConfig.resume.enabled) {
    links.push({ label: "Create Resume", href: "/resume?action=create" });
    // ATS checking only ever runs on an uploaded file (lib/ats.ts analyses
    // the PDF itself) - gated on `parsing`, the flag that actually turns
    // extraction/analysis on, not just the feature as a whole.
    if (featuresConfig.resume.parsing) {
      links.push({ label: "ATS Checker", href: "/resume?action=upload" });
    }
  }
  if (featuresConfig.applications.enabled) links.push({ label: "Track Applications", href: "/applications" });
  if (featuresConfig.jobAlerts.enabled) links.push({ label: "Job Alerts", href: "/preferences" });
  if (featuresConfig.jobPosting.enabled) links.push({ label: "Post a Job", href: "/job-postings" });
  return links;
}

export function SiteFooter() {
  const toolLinks = getToolLinks();

  return (
    <footer className="w-full border-t border-border bg-muted/30 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between gap-10">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="JobBoard Logo"
              width={24}
              height={24}
              className="h-6 w-6 opacity-70 grayscale hover:grayscale-0 transition-all"
            />
            <span className="font-semibold text-muted-foreground">JobBoard</span>
          </div>
          <div className="flex flex-col items-center md:items-start gap-1">
            <Typography variant="small" className="text-muted-foreground">
              &copy; {new Date().getFullYear()} CleanJobData. All rights reserved.
            </Typography>
            <Typography variant="small" className="text-muted-foreground">
              Powered by <a href="https://cleanjobdata.com" className="hover:text-primary underline underline-offset-4">CleanJobData API</a>
            </Typography>
          </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-end gap-10">
          <div className="flex flex-col items-center md:items-start gap-2">
            <Typography variant="overline">Tools</Typography>
            {toolLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col items-center md:items-start gap-2">
            <Typography variant="overline">CleanJobData</Typography>
            <a href="https://cleanjobdata.com/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">API Docs</a>
            <a href="https://cleanjobdata.com/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
            <a href="https://cleanjobdata.com/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
