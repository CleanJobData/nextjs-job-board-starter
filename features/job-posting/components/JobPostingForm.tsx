"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GeoSuggest } from "@/jobs/components/GeoSuggest";
import type { GeoSuggestResult } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Listbox } from "@/components/ui/Listbox";
import { Switch } from "@/components/ui/Switch";
import { Typography } from "@/components/ui/Typography";
import { createJobPosting } from "../actions/job-postings";

type CompanyOption = { id: string; name: string };

interface JobPostingFormProps {
  companies: CompanyOption[];
  /** Called after a successful create - lets the Dialog hosting this form close itself. */
  onSuccess?: () => void;
}

/**
 * Deliberately simple - one flat form, no wizard/multi-step UX. If the
 * poster has no company yet, they're pointed at "Post a Job" only after
 * creating one via CompanyForm (features/job-posting/components/CompanyForm.tsx)
 * - this form assumes at least one company option exists (the page below
 * only renders it once companies.length > 0).
 */
export function JobPostingForm({ companies, onSuccess }: JobPostingFormProps) {
  const router = useRouter();
  const [locations, setLocations] = React.useState<GeoSuggestResult[]>([]);
  // companyId and hasRemote move from native FormData reads to controlled
  // React state: Listbox and Switch are headlessui-backed controlled
  // components (like the existing GeoSuggest/locations field above), not
  // native name= form fields, so they can't be read off `formData` the way
  // <select>/<input type="checkbox"> could. companyId defaults to the first
  // company (mirrors the old <select>'s browser-default behavior of
  // preselecting its first <option>), so the field is never left in an
  // invalid unselected state the way a native required <select> could guard
  // against - there is always a valid selection here as long as
  // companies.length > 0 (guaranteed by the caller, see doc comment above).
  const [companyId, setCompanyId] = React.useState(companies[0]?.id ?? "");
  const [hasRemote, setHasRemote] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  function onSubmit(formData: FormData) {
    setError(null);
    // companyId is no longer a real form field, so it can't rely on native
    // `required` validation - guard it explicitly here instead, matching
    // the same fail-closed behavior the old required <select> gave for free.
    if (!companyId) {
      setError("Please select a company.");
      return;
    }
    startTransition(async () => {
      try {
        await createJobPosting({
          title: String(formData.get("title") || ""),
          description: String(formData.get("description") || ""),
          companyId,
          locations,
          employmentType: (formData.get("employmentType") as string) || null,
          hasRemote,
          salaryMin: formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null,
          salaryMax: formData.get("salaryMax") ? Number(formData.get("salaryMax")) : null,
          salaryCurrency: (formData.get("salaryCurrency") as string) || null,
          applicationUrl: String(formData.get("applicationUrl") || ""),
        });
        router.refresh();
        onSuccess?.();
      } catch (e: any) {
        setError(e.message ?? "Failed to create job posting.");
      }
    });
  }

  return (
    // No Card wrapper - this form is hosted inside a Dialog, which already
    // supplies the panel chrome and title. See CompanyForm for the same note.
    <form action={onSubmit}>
      <div className="space-y-6">
        <Typography variant="muted">
          Every new posting is reviewed by an admin before it appears publicly. It will show as
          &quot;Pending&quot; on your list until then.
        </Typography>

          <div className="space-y-4">
            <Typography variant="small" className="text-muted-foreground uppercase tracking-wide">
              Basics
            </Typography>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Company <span className="text-destructive">*</span>
              </label>
              {/* Listbox has no disabled prop (unlike Input/Textarea) - it's left
                  interactive during submission, same as Switch/GeoSuggest above;
                  the submit Button is disabled meanwhile so no double-submit risk. */}
              <Listbox options={companyOptions} value={companyId} onChange={setCompanyId} />
            </div>

            <div className="space-y-1">
              <label htmlFor="title" className="text-sm font-medium">
                Job title <span className="text-destructive">*</span>
              </label>
              <Input id="title" name="title" required disabled={pending} />
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-destructive">*</span>
              </label>
              <Textarea id="description" name="description" required rows={6} disabled={pending} />
            </div>
          </div>

          <div className="space-y-4 border-t border-border pt-6">
            <Typography variant="small" className="text-muted-foreground uppercase tracking-wide">
              Location &amp; type
            </Typography>
            <div className="space-y-1">
              <label className="text-sm font-medium">Location</label>
              <GeoSuggest selectedLocations={locations} onChange={setLocations} />
            </div>

            {/* Switch is a controlled boolean component (checked/onChange), same
                category as Listbox above - no name= attribute, so hasRemote is
                read from React state in onSubmit rather than formData. */}
            <Switch checked={hasRemote} onChange={setHasRemote} label="Remote friendly" />

            {/* grid-cols-1 sm:grid-cols-3: the original grid-cols-3 with no
                breakpoint squeezed three inputs (employment type, salary min,
                salary max) into unreadably narrow columns below the sm breakpoint
                - stacks to one column on mobile, matching the sm breakpoint phase
                1's MobileNav already established as this codebase's mobile cutoff. */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label htmlFor="employmentType" className="text-sm font-medium">
                  Employment type
                </label>
                <Input id="employmentType" name="employmentType" placeholder="full_time" disabled={pending} />
              </div>
              <div className="space-y-1">
                <label htmlFor="salaryMin" className="text-sm font-medium">
                  Salary min
                </label>
                <Input id="salaryMin" name="salaryMin" type="number" disabled={pending} />
              </div>
              <div className="space-y-1">
                <label htmlFor="salaryMax" className="text-sm font-medium">
                  Salary max
                </label>
                <Input id="salaryMax" name="salaryMax" type="number" disabled={pending} />
              </div>
            </div>
          </div>

          <div className="space-y-1 border-t border-border pt-6">
            <label htmlFor="applicationUrl" className="text-sm font-medium">
              Application URL <span className="text-destructive">*</span>
            </label>
            <Input
              id="applicationUrl"
              name="applicationUrl"
              type="url"
              required
              placeholder="https://..."
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">
              v1 only supports linking out to an external application page - there is no on-site apply flow.
            </p>
          </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end border-t border-border pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? "Posting..." : "Submit for review"}
          </Button>
        </div>
      </div>
    </form>
  );
}
