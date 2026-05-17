import * as React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/api/jobs";
import { JobDetailView } from "@/components/jobs/JobDetailView";
import { Button } from "@/components/ui/Button";
import { FaChevronLeft } from "react-icons/fa6";
import Link from "next/link";
import { ApiError } from "@/lib/api/client";

interface JobPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const job = await getJobById(id);
    return {
      title: `${job.title} at ${job.company?.name || "Unknown Company"} | CleanJobData`,
      description: job.company?.description || `Apply for ${job.title} position.`,
    };
  } catch {
    return {
      title: "Job Not Found | CleanJobData",
    };
  }
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params;

  try {
    const job = await getJobById(id);

    return (
      <div className="container mx-auto py-12 px-10">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link href="/">
              <FaChevronLeft className="mr-1 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <JobDetailView job={job} />
      </div>
    );
  } catch (error: any) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    
    console.error("[Job Page Error]", error);
    
    return (
      <div className="container mx-auto py-20 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't load the job details. Please try again later.
        </p>
        <Button asChild>
          <Link href="/">Return to Job Board</Link>
        </Button>
      </div>
    );
  }
}
