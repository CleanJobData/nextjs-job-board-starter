"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Typography } from "@/components/ui/Typography";
import { CompanyForm } from "./CompanyForm";
import { JobPostingForm } from "./JobPostingForm";
import { JobPostingsList, type JobPostingRow } from "./JobPostingsList";

type CompanyOption = { id: string; name: string };

/**
 * The postings tab: a header row (title + primary CTA) over the list, with
 * the create form behind a Dialog instead of permanently expanded below
 * the list. A long form sitting open at all times pushed the actual
 * postings up out of view and made the page read as "a form with a list
 * stapled on top" rather than a management view.
 *
 * If the user owns no company yet, the CTA opens CompanyForm instead -
 * a posting can't exist without one, so this keeps that a single obvious
 * next step rather than a dead-end button or a jump to the other tab.
 */
export function PostingsSection({
  postings,
  companies,
}: {
  postings: JobPostingRow[];
  companies: CompanyOption[];
}) {
  const [open, setOpen] = React.useState(false);
  const hasCompany = companies.length > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Your postings</Typography>
        <Button size="sm" onClick={() => setOpen(true)}>
          {hasCompany ? "New posting" : "Create a company"}
        </Button>
      </div>

      <JobPostingsList postings={postings} />

      <Dialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title={hasCompany ? "Post a job" : "Create a company first"}
        className="max-w-2xl"
      >
        {hasCompany ? (
          <JobPostingForm companies={companies} onSuccess={() => setOpen(false)} />
        ) : (
          <CompanyForm onSuccess={() => setOpen(false)} />
        )}
      </Dialog>
    </section>
  );
}
