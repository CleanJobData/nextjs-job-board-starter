"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GeoSuggest } from "@/jobs/components/GeoSuggest";
import type { GeoSuggestResult } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { createJobPosting } from "../actions/job-postings";

type CompanyOption = { id: string; name: string };

interface JobPostingFormProps {
  companies: CompanyOption[];
}

/**
 * Deliberately simple - one flat form, no wizard/multi-step UX. If the
 * poster has no company yet, they're pointed at "Post a Job" only after
 * creating one via CompanyForm (features/job-posting/components/CompanyForm.tsx)
 * - this form assumes at least one company option exists (the page below
 * only renders it once companies.length > 0).
 */
export function JobPostingForm({ companies }: JobPostingFormProps) {
  const router = useRouter();
  const [locations, setLocations] = React.useState<GeoSuggestResult[]>([]);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createJobPosting({
          title: String(formData.get("title") || ""),
          description: String(formData.get("description") || ""),
          companyId: String(formData.get("companyId") || ""),
          locations,
          employmentType: (formData.get("employmentType") as string) || null,
          hasRemote: formData.get("hasRemote") === "on",
          salaryMin: formData.get("salaryMin") ? Number(formData.get("salaryMin")) : null,
          salaryMax: formData.get("salaryMax") ? Number(formData.get("salaryMax")) : null,
          salaryCurrency: (formData.get("salaryCurrency") as string) || null,
          applicationUrl: String(formData.get("applicationUrl") || ""),
        });
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? "Failed to create job posting.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
      <Typography variant="h4" className="font-bold">
        Post a Job
      </Typography>
      <p className="text-xs text-muted-foreground">
        Every new posting is reviewed by an admin before it appears publicly. It will show as
        &quot;Pending&quot; below until then.
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium">Company</label>
        <select name="companyId" required className="w-full border rounded-md px-3 py-2 bg-background">
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Job title</label>
        <input name="title" required className="w-full border rounded-md px-3 py-2 bg-background" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea
          name="description"
          required
          rows={6}
          className="w-full border rounded-md px-3 py-2 bg-background"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Location</label>
        <GeoSuggest selectedLocations={locations} onChange={setLocations} />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" name="hasRemote" id="hasRemote" />
        <label htmlFor="hasRemote" className="text-sm">Remote friendly</label>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Employment type</label>
          <input name="employmentType" placeholder="full_time" className="w-full border rounded-md px-3 py-2 bg-background" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Salary min</label>
          <input name="salaryMin" type="number" className="w-full border rounded-md px-3 py-2 bg-background" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Salary max</label>
          <input name="salaryMax" type="number" className="w-full border rounded-md px-3 py-2 bg-background" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Application URL</label>
        <input
          name="applicationUrl"
          type="url"
          required
          placeholder="https://..."
          className="w-full border rounded-md px-3 py-2 bg-background"
        />
        <p className="text-xs text-muted-foreground">
          v1 only supports linking out to an external application page - there is no on-site apply flow.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Posting..." : "Submit for review"}
      </Button>
    </form>
  );
}
