import { Typography } from "@/components/ui/Typography";
import { ApplicationRow } from "./ApplicationRow";
import type { ApplicationStatus } from "../actions/applications";

type ApplicationRowData = {
  id: string;
  jobId: string | null;
  jobTitle: string;
  companyName: string | null;
  jobUrl: string | null;
  status: ApplicationStatus;
  notes: string | null;
  updatedAt: Date;
};

export function ApplicationsList({ applications }: { applications: ApplicationRowData[] }) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <Typography variant="muted">
          You haven&apos;t tracked any applications yet. Browse jobs and track the ones you apply to.
        </Typography>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {applications.map((application) => (
        <ApplicationRow key={application.id} application={application} />
      ))}
    </div>
  );
}
