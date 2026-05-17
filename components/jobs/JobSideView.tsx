"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { JobDetailView } from "./JobDetailView";
import { JobDetail } from "@/lib/api/types";
import { FaSpinner } from "react-icons/fa6";

interface JobSideViewProps {
  jobPromise: Promise<JobDetail>;
}

export function JobSideView({ jobPromise }: JobSideViewProps) {
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
        <JobDetailContent jobPromise={jobPromise} />
      </React.Suspense>
    </Sheet>
  );
}

function JobDetailContent({ jobPromise }: { jobPromise: Promise<JobDetail> }) {
  // use() is the modern way to unwrap promises in Client Components
  const job = React.use(jobPromise);
  return <JobDetailView job={job} />;
}

function JobLoadingState() {
  return (
    <div className="py-40 flex flex-col items-center justify-center gap-4">
      <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse font-medium">
        Loading job details...
      </p>
    </div>
  );
}
