import * as React from "react";
import { getJobById } from "@/lib/api/jobs";
import { JobSideView } from "@/components/jobs/JobSideView";

interface InterceptedJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterceptedJobPage({
  params,
}: InterceptedJobPageProps) {
  const { id } = await params;
  
  // Initiate fetch but don't await it here to allow the Sheet to open immediately
  const jobPromise = getJobById(id);

  return <JobSideView jobPromise={jobPromise} />;
}
