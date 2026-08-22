import { Typography } from "@/components/ui/Typography";
import { getMyCompanies, } from "../../actions/companies";
import { getMyJobPostings } from "../../actions/job-postings";
import { CompanyForm } from "../../components/CompanyForm";
import { JobPostingForm } from "../../components/JobPostingForm";
import { JobPostingsList, type JobPostingRow } from "../../components/JobPostingsList";

export default async function JobPostingsPage() {
  const companies = await getMyCompanies();
  const postingRows = await getMyJobPostings();

  const postings: JobPostingRow[] = postingRows.map(({ job, company }) => ({
    id: job.id,
    title: job.title,
    companyName: company.name,
    status: job.status,
    published: job.published.toISOString(),
  }));

  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl space-y-10">
      <div>
        <Typography variant="h1" className="mb-2">My Job Postings</Typography>
        <Typography className="text-muted-foreground">
          Manage the jobs you&apos;ve posted. New postings are reviewed by an admin before going
          public.
        </Typography>
      </div>

      <JobPostingsList postings={postings} />

      {companies.length === 0 ? (
        <CompanyForm />
      ) : (
        <JobPostingForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
      )}
    </div>
  );
}
