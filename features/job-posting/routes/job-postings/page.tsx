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
    companyLogo: company.logo,
    status: job.status,
    published: job.published.toISOString(),
    locationText: job.locationText,
    hasRemote: job.hasRemote,
    salaryText: job.salaryText,
    employmentType: job.employmentType,
    rejectionReason: job.rejectionReason,
  }));

  const pendingCount = postings.filter((p) => p.status === "pending").length;
  const approvedCount = postings.filter((p) => p.status === "approved").length;

  const postingCountByCompanyId = new Map<string, number>();
  for (const { job } of postingRows) {
    if (!job.companyId) continue;
    postingCountByCompanyId.set(job.companyId, (postingCountByCompanyId.get(job.companyId) ?? 0) + 1);
  }

  return (
    <PageContainer size="full" className="space-y-10">
      <div>
        <Typography variant="h1" className="mb-2">My Job Postings</Typography>
        <Typography className="text-muted-foreground mb-6">
          Manage the jobs you&apos;ve posted. New postings are reviewed by an admin before going
          public.
        </Typography>
        {postings.length > 0 && (
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 border-t border-border pt-5">
            <div className="flex items-baseline gap-2">
              <Typography className="text-2xl font-semibold tabular-nums">{postings.length}</Typography>
              <Typography variant="small" className="text-muted-foreground">total postings</Typography>
            </div>
            <div className="flex items-baseline gap-2">
              <Typography className="text-2xl font-semibold tabular-nums">{pendingCount}</Typography>
              <Typography variant="small" className="text-muted-foreground">pending review</Typography>
            </div>
            <div className="flex items-baseline gap-2">
              <Typography className="text-2xl font-semibold tabular-nums">{approvedCount}</Typography>
              <Typography variant="small" className="text-muted-foreground">live</Typography>
            </div>
          </div>
        )}
      </div>

      <JobPostingsTabs
        postingsCount={postings.length}
        companiesCount={companies.length}
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
                postingCount: postingCountByCompanyId.get(c.id) ?? 0,
              }))}
            />
          </section>
        }
      />
    </PageContainer>
  );
}
