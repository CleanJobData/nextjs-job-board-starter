import * as React from "react";
import Link from "next/link";
import { MapPin, Globe, Briefcase, DollarSign, Clock } from "lucide-react";
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
    <Card className="group hover:border-primary/50 transition-colors">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {job.company?.logo ? (
              <img
                src={job.company.logo}
                alt={`${job.company.name} logo`}
                className="h-12 w-12 rounded-md object-contain bg-muted p-1"
              />
            ) : (
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <Typography
                variant="small"
                className="text-muted-foreground font-medium"
              >
                {job.company?.name || "Unknown Company"}
              </Typography>
              <Link href={`/jobs/${job.id}`} className="hover:underline">
                <Typography
                  variant="h4"
                  className="line-clamp-1 group-hover:text-primary transition-colors"
                >
                  {job.title}
                </Typography>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">{locationLabel}</span>
          </div>
          {salaryDisplay && (
            <div className="flex items-center gap-2 text-foreground font-medium">
              <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="line-clamp-1">{salaryDisplay}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{addedAgo}</span>
          </div>
          {job.has_remote && (
            <div className="flex items-center gap-2 text-accent font-medium">
              <Globe className="h-4 w-4 shrink-0" />
              <span>Remote</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {job.experience_level && (
            <Badge variant="secondary" className="capitalize">
              {job.experience_level.toLowerCase()}
            </Badge>
          )}
          {job.employment_type && (
            <Badge variant="outline" className="capitalize">
              {job.employment_type.replace("_", " ")}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
