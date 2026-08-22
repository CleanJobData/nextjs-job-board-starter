import * as React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobById } from "@/jobs/lib/api";
import { JobDetailView } from "@/jobs/components/JobDetailView";
import { activeJobDetailActions } from "@/features/registry";
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
      title: `${job.title} at ${job.company?.name || "Unknown Company"}`,
      description: job.company?.description || `Apply for ${job.title} position at ${job.company?.name}.`,
      openGraph: {
        title: `${job.title} at ${job.company?.name || "Unknown Company"}`,
        description: job.company?.description || `Apply for ${job.title} position at ${job.company?.name}.`,
      },
      twitter: {
        card: "summary_large_image",
        title: `${job.title} at ${job.company?.name || "Unknown Company"}`,
        description: job.company?.description || `Apply for ${job.title} position at ${job.company?.name}.`,
      },
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

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: job.description,
      datePosted: job.published,
      validThrough: job.expired_at,
      employmentType: job.employment_type,
      hiringOrganization: {
        "@type": "Organization",
        name: job.company?.name,
        sameAs: job.company?.website_url,
        logo: job.company?.logo,
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.location,
        },
      },
      baseSalary: job.salary_min
        ? {
            "@type": "MonetaryAmount",
            currency: job.salary_currency || "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salary_min,
              maxValue: job.salary_max,
              unitText: "YEAR",
            },
          }
        : undefined,
    };

    return (
      <div className="container mx-auto py-12 px-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
            <Link href="/">
              <FaChevronLeft className="mr-1 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
        </div>

        <JobDetailView
          job={job}
          extraActions={activeJobDetailActions.map((Action, i) => (
            <Action key={i} job={job} />
          ))}
        />
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
