import * as React from "react";
import Link from "next/link";
import { FaLocationDot, FaGlobe, FaDollarSign, FaClock } from "react-icons/fa6";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { Job } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { clampLocationLabel } from "@/lib/clampLocation";
import { formatAddedAgo } from "@/lib/formatAddedAgo";
import { formatNumber } from "@/lib/utils";

interface JobCardProps {
  job: Job;
}

/** One metadata item - fixed icon box so every row aligns on the same axis regardless of which glyph it uses. */
function Meta({
  icon: Icon,
  children,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    // min-w-0 on both the row and the label: a flex item won't shrink below
    // its content width by default, so `truncate` alone silently does
    // nothing and long values (a full "City, Region, Country" location, a
    // wide salary range) overflow the card instead of ellipsing.
    <div
      className={`flex items-center gap-2 min-w-0 ${accent ? "text-primary" : "text-muted-foreground"}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate min-w-0">{children}</span>
    </div>
  );
}

export function JobCard({ job }: JobCardProps) {
  const { label: locationLabel } = clampLocationLabel(job.location);
  const addedAgo = formatAddedAgo(job.published);

  const salaryDisplay = React.useMemo(() => {
    if (job.salary_text) return job.salary_text;
    if (job.salary_min) {
      const min = formatNumber(job.salary_min);
      const max = job.salary_max ? ` - ${formatNumber(job.salary_max)}` : "+";
      const currency = job.salary_currency || "$";
      return `${currency}${min}${max}`;
    }
    return null;
  }, [job.salary_text, job.salary_min, job.salary_max, job.salary_currency]);

  return (
    <Link href={`/jobs/${job.id}`} scroll={false} className="block group h-full">
      {/* Quiet border-tint hover, matching ApplicationCard/JobPostingsList -
          not a shadow+scale animation. The title tinting to primary is the
          real "this is clickable" signal. */}
      <Card className="h-full flex flex-col transition-colors hover:border-primary/50">
        <CardContent className="p-4 sm:p-5 flex flex-col flex-1 gap-4">
          <div className="flex items-start gap-3">
            <CompanyLogo
              src={job.company?.logo}
              fallbackIcon="briefcase"
              className="h-11 w-11 rounded-lg bg-muted border border-border shrink-0"
              imageClassName="rounded-lg p-1"
              iconClassName="h-4 w-4 text-muted-foreground"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              {/* Title leads, company follows - the job is what someone is
                  scanning for. This used to be inverted, with the company
                  name set in tiny uppercase letter-spaced text above a
                  bolder title, which read as a label stuck on a heading.
                  break-words so a single very long unbroken token (some
                  titles are one long hyphen-free string) wraps instead of
                  pushing the card's layout wider than its column. */}
              <Typography
                variant="large"
                className="line-clamp-2 leading-snug break-words group-hover:text-primary transition-colors"
              >
                {job.title}
              </Typography>
              <Typography variant="small" className="text-muted-foreground truncate">
                {job.company?.name || "Unknown Company"}
              </Typography>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Meta icon={FaLocationDot}>{locationLabel}</Meta>
            {salaryDisplay && (
              <Meta icon={FaDollarSign} accent>
                {salaryDisplay}
              </Meta>
            )}
            <Meta icon={FaClock}>{addedAgo}</Meta>
            {job.has_remote && (
              <Meta icon={FaGlobe} accent>
                Remote
              </Meta>
            )}
          </div>

          {(job.experience_level || job.employment_type) && (
            <div className="flex flex-wrap gap-2 mt-auto pt-1">
              {job.experience_level && (
                <Badge variant="secondary" className="capitalize font-medium">
                  {job.experience_level.toLowerCase()}
                </Badge>
              )}
              {job.employment_type && (
                <Badge variant="outline" className="capitalize font-medium">
                  {job.employment_type.replace(/_/g, " ")}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
