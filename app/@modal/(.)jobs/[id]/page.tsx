import * as React from "react";
import { getJobById } from "@/jobs/lib/api";
import { JobSideView } from "@/jobs/components/JobSideView";
import { activeJobDetailActions } from "@/features/registry";

interface InterceptedJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterceptedJobPage({
  params,
}: InterceptedJobPageProps) {
  const { id } = await params;

  // Initiate fetch but don't await it here to allow the Sheet to open immediately.
  const jobPromise = getJobById(id);

  // activeJobDetailActions must only ever be imported server-side (it pulls in
  // job-sync's cronTasks -> lib/db/client.ts -> pg, which broke the browser
  // bundle when a client component imported it directly - see
  // features/applications/README.md). Building this as its own promise, resolved
  // client-side via React.use() alongside jobPromise, keeps the instant-open
  // UX while never letting the registry import cross into client code.
  const extraActionsPromise = jobPromise.then((job) =>
    activeJobDetailActions.map((Action, i) => <Action key={i} job={job} />)
  );

  return <JobSideView jobPromise={jobPromise} extraActionsPromise={extraActionsPromise} />;
}
