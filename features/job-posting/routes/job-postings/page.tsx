import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
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
    rejectionReason: job.rejectionReason,
  }));

  return (
    <PageContainer size="full" className="space-y-10">
      <div>
        <Typography variant="h1" className="mb-2">My Job Postings</Typography>
        <Typography className="text-muted-foreground">
          Manage the jobs you&apos;ve posted. New postings are reviewed by an admin before going
          public.
        </Typography>
      </div>

      <section className="space-y-3">
        <Typography variant="h4">Your postings</Typography>
        <JobPostingsList postings={postings} />
      </section>

      <section className="space-y-3">
        <Typography variant="h4">
          {companies.length === 0 ? "Create your company" : "Post a new job"}
        </Typography>
        {companies.length === 0 ? (
          <CompanyForm />
        ) : (
          <JobPostingForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
        )}
      </section>
    </PageContainer>
  );
}
