"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Typography } from "@/components/ui/Typography";
import { createCompany, updateCompany } from "../actions/companies";

type ExistingCompany = {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  industry: string | null;
  headquarters: string | null;
  logo: string | null;
};

interface CompanyFormProps {
  /**
   * When provided, the form switches from "create a brand-new company" to
   * "edit this existing company" - same fields, pre-filled, submitting to
   * updateCompany() instead of createCompany(). Claiming an existing
   * CleanJobData-ingested company is still admin-gated and out of scope
   * here (see createCompany()'s doc comment) - `company` is always one the
   * caller already knows the current user owns (getMyCompanies()'s rows).
   */
  company?: ExistingCompany;
  /** Called after a successful create/update - lets a Dialog-hosted form close itself. */
  onSuccess?: () => void;
}

export function CompanyForm({ company, onSuccess }: CompanyFormProps) {
  const router = useRouter();
  const isEdit = !!company;
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  // Tracks the explicit "remove logo" choice for the edit case - a plain
  // checkbox, independent of the file input, so the three logo states
  // (unchanged / replaced / cleared) are each expressible: leave both alone
  // for "unchanged", pick a new file for "replaced", or check this with no
  // file chosen for "cleared". See updateCompany()'s UpdateCompanyInput doc
  // comment for the server-side half of this contract.
  const [removeLogo, setRemoveLogo] = React.useState(false);

  function onSubmit(formData: FormData) {
    setError(null);
    const logoFile = formData.get("logo") as File | null;
    const logo = logoFile && logoFile.size > 0 ? logoFile : null;
    startTransition(async () => {
      try {
        const shared = {
          name: String(formData.get("name") || ""),
          description: (formData.get("description") as string) || null,
          websiteUrl: (formData.get("websiteUrl") as string) || null,
          industry: (formData.get("industry") as string) || null,
          headquarters: (formData.get("headquarters") as string) || null,
        };
        if (isEdit) {
          await updateCompany({
            id: company.id,
            ...shared,
            logo,
            removeLogo: !logo && removeLogo,
          });
        } else {
          await createCompany({ ...shared, logo });
        }
        router.refresh();
        onSuccess?.();
      } catch (e: any) {
        setError(e.message ?? `Failed to ${isEdit ? "update" : "create"} company.`);
      }
    });
  }

  return (
    // No Card wrapper: this form is always hosted inside a Dialog, which
    // already provides the panel chrome (bg-card, border, padding) and the
    // title. Rendering a Card here too produced a visible box-inside-a-box.
    // The host owns the container; this component owns only the fields.
    <form action={onSubmit}>
      <div className="space-y-4">
        {!isEdit && (
          <Typography variant="muted">
            You need a company profile before you can post a job. Already have a company on
            CleanJobData? Claiming it is coming soon - create a new profile for now.
          </Typography>
        )}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Company name <span className="text-destructive">*</span>
            </label>
            <Input name="name" required disabled={pending} defaultValue={company?.name} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <Textarea name="description" rows={3} disabled={pending} defaultValue={company?.description ?? undefined} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Website</label>
            <Input
              name="websiteUrl"
              type="url"
              placeholder="https://..."
              disabled={pending}
              defaultValue={company?.websiteUrl ?? undefined}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Industry</label>
              <Input name="industry" disabled={pending} defaultValue={company?.industry ?? undefined} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Headquarters</label>
              <Input name="headquarters" disabled={pending} defaultValue={company?.headquarters ?? undefined} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Logo</label>
            {isEdit && company.logo && !removeLogo && (
              <div className="flex items-center gap-3 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={company.logo} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                <span className="text-xs text-muted-foreground">Current logo - choose a file below to replace it.</span>
              </div>
            )}
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
              disabled={pending || (isEdit && removeLogo)}
              onChange={() => removeLogo && setRemoveLogo(false)}
              className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground file:cursor-pointer hover:file:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isEdit && company.logo && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <input
                  type="checkbox"
                  checked={removeLogo}
                  disabled={pending}
                  onChange={(e) => setRemoveLogo(e.target.checked)}
                />
                Remove current logo
              </label>
            )}
          </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="submit" disabled={pending} className="mt-4">
            {pending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save changes" : "Create company"}
          </Button>
        </div>
      </div>
    </form>
  );
}
