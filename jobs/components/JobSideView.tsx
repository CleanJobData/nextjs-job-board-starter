"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { JobDetailView } from "./JobDetailView";
import { JobDetail } from "@/lib/api/types";
import { FaSpinner } from "react-icons/fa6";
import { Typography } from "@/components/ui/Typography";

interface JobSideViewProps {
  jobPromise: Promise<JobDetail>;
  /** Pre-rendered feature actions (see app/@modal/(.)jobs/[id]/page.tsx) - resolves alongside jobPromise, never imported directly by this client component. */
  extraActionsPromise: Promise<React.ReactNode>;
}

export function JobSideView({ jobPromise, extraActionsPromise }: JobSideViewProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(true);

  const handleClose = React.useCallback(() => {
    setIsOpen(false);
    // Wait for animation to finish before going back
    setTimeout(() => {
      router.back();
    }, 500);
  }, [router]);

  return (
    <Sheet isOpen={isOpen} onClose={handleClose}>
      <React.Suspense fallback={<JobLoadingState />}>
        <JobDetailContent jobPromise={jobPromise} extraActionsPromise={extraActionsPromise} />
      </React.Suspense>
    </Sheet>
  );
}

function JobDetailContent({
  jobPromise,
  extraActionsPromise,
}: {
  jobPromise: Promise<JobDetail>;
  extraActionsPromise: Promise<React.ReactNode>;
}) {
  // use() is the modern way to unwrap promises in Client Components
  const job = React.use(jobPromise);
  const extraActions = React.use(extraActionsPromise);
  return <JobDetailView job={job} extraActions={extraActions} />;
}

function JobLoadingState() {
  return (
    <div className="py-40 flex flex-col items-center justify-center gap-4">
      <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      {/* variant="muted" for the color/intent match; animate-pulse/font-medium
          kept as an additive className override rather than baked into the
          variant, same "variant for semantics, className for one-off flair"
          split used by JobCard elsewhere in this codebase. */}
      <Typography variant="muted" className="animate-pulse font-medium">
        Loading job details...
      </Typography>
    </div>
  );
}
