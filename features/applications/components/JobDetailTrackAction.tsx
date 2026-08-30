import type { Job } from "@/lib/api/types";
import { TrackApplicationButton } from "./TrackApplicationButton";

/** Adapter registered via feature.ts's jobDetailActions - maps a full Job onto TrackApplicationButton's minimal input shape. */
export function JobDetailTrackAction({ job }: { job: Job }) {
  return (
    <TrackApplicationButton
      job={{
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.company?.name ?? null,
        companyLogo: job.company?.logo ?? null,
        jobUrl: job.application_url,
      }}
    />
  );
}
