import * as React from "react";
import Link from "next/link";
import { FaLocationDot, FaGlobe, FaDollarSign, FaClock } from "react-icons/fa6";
import { CompanyLogo } from "@/components/jobs/CompanyLogo";
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
      <Card className="hover:border-primary/50 transition-all duration-300 hover:shadow-md h-full flex flex-col">
        <CardContent className="p-4 sm:p-6 space-y-5 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <CompanyLogo
                src={job.company?.logo}
                fallbackIcon="briefcase"
                className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-muted p-1 border border-border/50 group-hover:border-primary/20 transition-colors"
                imageClassName="rounded-lg"
                iconClassName="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground/50"
              />
              <div className="space-y-1 min-w-0">
                <Typography
                  variant="small"
                  className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]"
                >
                  {job.company?.name || "Unknown Company"}
                </Typography>
                <Typography
                  variant="h4"
                  className="line-clamp-2 group-hover:text-primary transition-colors text-base sm:text-lg font-bold leading-tight"
                >
                  {job.title}
                </Typography>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="flex gap-2.5 text-muted-foreground">
              <div className="flex shrink-0 pt-1">
                <FaLocationDot className="h-3 w-3" />
              </div>
              <span className="line-clamp-1 font-medium">{locationLabel}</span>
            </div>
            
            {salaryDisplay && (
              <div className="flex gap-2.5 text-foreground">
                <div className="flex shrink-0 pt-1.5 text-primary">
                  <FaDollarSign className="h-3 w-3" />
                </div>
                <span className="line-clamp-1 font-bold">{salaryDisplay}</span>
              </div>
            )}

            <div className="flex gap-2.5 text-muted-foreground">
              <div className="flex shrink-0 pt-1.5">
                <FaClock className="h-2.5 w-2.5" />
              </div>
              <span className="font-medium">{addedAgo}</span>
            </div>

            {job.has_remote && (
              <div className="flex gap-2.5 text-emerald-600 dark:text-emerald-400">
                <div className="flex shrink-0 pt-1.5">
                  <FaGlobe className="h-2.5 w-2.5" />
                </div>
                <span className="font-bold">Remote</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1 mt-auto">
            {job.experience_level && (
              <Badge variant="secondary" className="capitalize px-2.5 py-0.5 text-[11px] font-bold tracking-wide bg-muted/50 border-transparent">
                {job.experience_level.toLowerCase()}
              </Badge>
            )}
            {job.employment_type && (
              <Badge variant="outline" className="capitalize px-2.5 py-0.5 text-[11px] font-bold tracking-wide border-border/60">
                {job.employment_type.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
