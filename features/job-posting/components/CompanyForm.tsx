"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
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
    <Card>
      <form action={onSubmit}>
        <CardHeader>
          <CardTitle className="text-xl">Create your company profile</CardTitle>
          <CardDescription>
            You need a company profile before you can post a job. Already have a company on
            CleanJobData? Claiming it is coming soon - create a new profile for now.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Company name <span className="text-destructive">*</span>
            </label>
            <Input name="name" required disabled={pending} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" rows={3} disabled={pending} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Website</label>
            <Input name="websiteUrl" type="url" placeholder="https://..." disabled={pending} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Industry</label>
              <Input name="industry" disabled={pending} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Headquarters</label>
              <Input name="headquarters" disabled={pending} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Logo</label>
            {/*
              Input.tsx wraps its <input> in a fixed-height (h-11) relative div
              styled for text entry (background, padding, focus ring) - a
              type="file" input doesn't render text the same way (it shows a
              native button + filename, no placeholder/left-right icon slots
              apply), so reusing Input as-is would mean an empty, misleadingly
              text-box-shaped chrome around a file picker. Instead we style
              only the native `::file-selector-button` pseudo-element (a real,
              supported Tailwind pattern via arbitrary variants) so the button
              itself matches the app's token palette, while leaving the
              filename text at its native browser rendering - this keeps the
              control legible and unambiguous as a file input rather than
              dressing it up as something it isn't.
            */}
            <input
              name="logo"
              type="file"
              accept="image/*"
              disabled={pending}
              className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:cursor-pointer hover:file:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>

        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create company"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
