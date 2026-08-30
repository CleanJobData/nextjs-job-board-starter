import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { getMyCompanies, } from "../../actions/companies";
import { getMyJobPostings } from "../../actions/job-postings";
import { CompanyForm } from "../../components/CompanyForm";
import { CompaniesManager } from "../../components/CompaniesManager";
import { JobPostingForm } from "../../components/JobPostingForm";
import { JobPostingsList, type JobPostingRow } from "../../components/JobPostingsList";
import { JobPostingsTabs } from "../../components/JobPostingsTabs";

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

      <JobPostingsTabs
        postingsSection={
          <section className="space-y-3">
            <Typography variant="h4">Your postings</Typography>
            <JobPostingsList postings={postings} />

            <div className="pt-4">
              <Typography variant="h4" className="mb-3">
                {companies.length === 0 ? "Create your company" : "Post a new job"}
              </Typography>
              {companies.length === 0 ? (
                <CompanyForm />
              ) : (
                <JobPostingForm companies={companies.map((c) => ({ id: c.id, name: c.name }))} />
              )}
            </div>
          </section>
        }
        companiesSection={
          <section className="space-y-3">
            <Typography variant="h4">Your companies</Typography>
            <CompaniesManager
              companies={companies.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                websiteUrl: c.websiteUrl,
                industry: c.industry,
                headquarters: c.headquarters,
                logo: c.logo,
              }))}
            />
          </section>
        }
      />
    </PageContainer>
  );
}
