import Link from "next/link";
import { Typography } from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";

/**
 * All the copy a template consumer would actually want to change lives in
 * this one object, at the top of the file, separate from the JSX/layout
 * below it - swapping the pitch for a different brand shouldn't require
 * reading (or risking breaking) the markup around it.
 */
const COPY = {
  eyebrow: "Structured job data for the modern workforce",
  headline: "Find your next",
  headlineAccent: "dream job.",
  subhead:
    "Discover curated opportunities for data professionals, engineers, and designers - or post your own opening and reach candidates directly.",
  primaryCta: { label: "Browse Jobs", href: "/jobs" },
  secondaryCta: { label: "Post a Job", href: "/job-postings" },
};

interface HeroProps {
  /** Decided by the page (features.config.ts's jobPosting.enabled), not
   * this component - a template that never turns job-posting on shouldn't
   * show a dead-end CTA to it. */
  showPostJobCta: boolean;
}

export function Hero({ showPostJobCta }: HeroProps) {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-6 py-16 md:py-24">
      <Typography variant="small" className="text-primary font-semibold uppercase tracking-wide">
        {COPY.eyebrow}
      </Typography>
      <Typography variant="h1" className="text-4xl md:text-6xl font-extrabold tracking-tight">
        {COPY.headline} <span className="text-primary">{COPY.headlineAccent}</span>
      </Typography>
      <Typography variant="lead" className="text-xl text-muted-foreground max-w-2xl mx-auto">
        {COPY.subhead}
      </Typography>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button size="lg" asChild>
          <Link href={COPY.primaryCta.href}>{COPY.primaryCta.label}</Link>
        </Button>
        {showPostJobCta && (
          <Button size="lg" variant="outline" asChild>
            <Link href={COPY.secondaryCta.href}>{COPY.secondaryCta.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
