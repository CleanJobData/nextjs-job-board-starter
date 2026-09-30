import * as React from "react";
import Link from "next/link";
import { FaGlobe } from "react-icons/fa6";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { Job } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { Typography } from "@/components/ui/Typography";
import { clampLocationLabel } from "@/lib/clampLocation";
import { formatAddedAgo } from "@/lib/formatAddedAgo";
import { formatNumber } from "@/lib/utils";

interface JobCardProps {
  job: Job;
}

/** One inline metadata item, "·"-separated from its neighbours rather than boxed - a job board's list reads as one scannable line of facts, not a grid of icon+label pairs pretending to be a dashboard widget. */
function MetaItem({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={accent ? "text-primary font-medium" : undefined}>{children}</span>;
}

function Dot() {
  return <span className="text-border select-none">·</span>;
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

  const metaItems: React.ReactNode[] = [];
  if (locationLabel) metaItems.push(<MetaItem key="loc">{locationLabel}</MetaItem>);
  if (job.has_remote) {
    metaItems.push(
      <MetaItem key="remote" accent>
        <FaGlobe className="inline h-3 w-3 -mt-0.5 mr-1" />
        Remote
      </MetaItem>
    );
  }
  if (salaryDisplay) metaItems.push(<MetaItem key="salary" accent>{salaryDisplay}</MetaItem>);
  if (addedAgo) metaItems.push(<MetaItem key="ago">{addedAgo}</MetaItem>);

  return (
    // A full-bleed row, not a boxed card: no per-item border/shadow/radius -
    // JobGrid.tsx wraps the whole list in ONE panel, and rows are separated
    // by a hairline divider + a quiet background tint on hover, the way an
    // actual list of results reads (LinkedIn/Indeed/Wellfound) rather than
    // a grid of dashboard widgets that happen to contain job data.
    <Link href={`/jobs/${job.id}`} scroll={false} className="group block">
      <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors hover:bg-muted/50">
        <CompanyLogo
          src={job.company?.logo}
          fallbackIcon="briefcase"
          className="h-10 w-10 rounded-lg bg-muted border border-border shrink-0"
          imageClassName="rounded-lg p-1"
          iconClassName="h-4 w-4 text-muted-foreground"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Typography className="font-semibold leading-snug truncate group-hover:text-primary transition-colors">
                {job.title}
              </Typography>
              <Typography variant="small" className="text-muted-foreground truncate">
                {job.company?.name || "Unknown Company"}
              </Typography>
            </div>

            {(job.experience_level || job.employment_type) && (
              <div className="hidden sm:flex flex-wrap justify-end gap-1.5 shrink-0">
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
          </div>

          {metaItems.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              {metaItems.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <Dot />}
                  {item}
                </React.Fragment>
              ))}
            </div>
          )}

          {(job.experience_level || job.employment_type) && (
            <div className="mt-2 flex flex-wrap gap-1.5 sm:hidden">
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
        </div>
      </div>
    </Link>
  );
}
