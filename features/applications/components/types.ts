import type { ApplicationStatus } from "../actions/applications";

export type ApplicationRowData = {
  id: string;
  jobId: string | null;
  jobTitle: string;
  companyName: string | null;
  jobUrl: string | null;
  status: ApplicationStatus;
  notes: string | null;
  updatedAt: Date;
};
