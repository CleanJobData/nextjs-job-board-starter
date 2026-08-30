import { FaClipboardList } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
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
      <EmptyState
        icon={<FaClipboardList />}
        title="No tracked applications yet"
        description="Browse jobs and track the ones you apply to, so you can follow their status here."
        action={<Button href="/jobs">Browse jobs</Button>}
      />
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
