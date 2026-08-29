"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { createCompany } from "../actions/companies";

/**
 * Only the "create a brand-new posted company" flow - claiming an existing
 * CleanJobData-ingested company is admin-gated and left for phase 3 (see
 * createCompany()'s doc comment).
 */
export function CompanyForm() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    const logoFile = formData.get("logo") as File | null;
    startTransition(async () => {
      try {
        await createCompany({
          name: String(formData.get("name") || ""),
          description: (formData.get("description") as string) || null,
          websiteUrl: (formData.get("websiteUrl") as string) || null,
          industry: (formData.get("industry") as string) || null,
          headquarters: (formData.get("headquarters") as string) || null,
          // Pass the File itself, not a pre-converted Buffer - a Node Buffer
          // instance doesn't survive the Server Action wire format intact
          // (it arrives server-side as a plain object, not a real buffer),
          // but File is natively supported across that boundary. Converted
          // to a real Buffer server-side in createCompany() instead.
          logo: logoFile && logoFile.size > 0 ? logoFile : null,
        });
        router.refresh();
      } catch (e: any) {
        setError(e.message ?? "Failed to create company.");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-4 p-6 rounded-2xl border border-border bg-card">
      <Typography variant="h4" className="font-bold">
        Create your company profile
      </Typography>
      <p className="text-xs text-muted-foreground">
        You need a company profile before you can post a job. Already have a company on
        CleanJobData? Claiming it is coming soon - create a new profile for now.
      </p>

      <div className="space-y-1">
        <label className="text-sm font-medium">Company name</label>
        <input name="name" required className="w-full border rounded-md px-3 py-2 bg-background" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Description</label>
        <textarea name="description" rows={3} className="w-full border rounded-md px-3 py-2 bg-background" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Website</label>
        <input name="websiteUrl" type="url" className="w-full border rounded-md px-3 py-2 bg-background" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Industry</label>
          <input name="industry" className="w-full border rounded-md px-3 py-2 bg-background" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Headquarters</label>
          <input name="headquarters" className="w-full border rounded-md px-3 py-2 bg-background" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Logo</label>
        <input name="logo" type="file" accept="image/*" className="w-full text-sm" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating..." : "Create company"}
      </Button>
    </form>
  );
}
