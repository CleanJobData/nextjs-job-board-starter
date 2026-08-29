import * as React from "react";
import { getJobDetail } from "@/jobs/lib/getJobs";
import { JobSideView } from "@/jobs/components/JobSideView";
import { activeJobDetailActions } from "@/features/registry";

interface InterceptedJobPageProps {
  params: Promise<{ id: string }>;
}

export default async function InterceptedJobPage({
  params,
}: InterceptedJobPageProps) {
  const { id } = await params;

  // getJobDetail(), not getJobById() directly - a source="posted" job (see
  // that function's doc comment) has no CleanJobData identity, so a direct
  // getJobById() call 500s against the live API for its id. This same bug
  // was already fixed in jobs/routes/JobDetailPage.tsx (the full-page
  // route) but missed here on the intercepted-modal route - same fix.
  // Initiate fetch but don't await it here to allow the Sheet to open immediately.
  const jobPromise = getJobDetail(id);

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
