"use client";

import * as React from "react";
import { FaBuilding } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Typography } from "@/components/ui/Typography";
import { EmptyState } from "@/components/ui/EmptyState";
import { CompanyLogo } from "@/jobs/components/CompanyLogo";
import { CompanyForm } from "./CompanyForm";

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  industry: string | null;
  headquarters: string | null;
  logo: string | null;
  /** Cheap to compute from the postings the page already fetched (see route's page.tsx) - a real, useful count, not decoration. */
  postingCount: number;
};

interface CompaniesManagerProps {
  companies: CompanyRow[];
}

/**
 * Lists every company the current user owns and lets them edit any of them
 * (via a Dialog-hosted CompanyForm in edit mode) or add another one at any
 * time - not just when they have zero, the way the old CompanyForm-only gate
 * worked. Company deletion is deliberately not offered here (see the phase
 * spec: a company may have live job postings attached, and deciding what
 * happens to those on delete is a separate design decision, not this
 * pass's to make).
 */
export function CompaniesManager({ companies }: CompaniesManagerProps) {
  const [editing, setEditing] = React.useState<CompanyRow | null>(null);
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Title lives in this row, not above it in the page: the "Add
          company" CTA belongs on the same baseline as the section heading
          it acts on, rather than floating on its own line underneath. */}
      <div className="flex items-center justify-between gap-4">
        <Typography variant="h4">Your companies</Typography>
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          Add company
        </Button>
      </div>

      {companies.length === 0 ? (
        <EmptyState
          icon={<FaBuilding />}
          title="No companies yet"
          description="Create a company profile to start posting jobs under it."
        />
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CompanyLogo src={company.logo} className="h-10 w-10 rounded-lg shrink-0" iconClassName="h-4 w-4" />
                  <div className="min-w-0">
                    <Typography className="font-medium truncate">{company.name}</Typography>
                    <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                      {company.industry && (
                        <Typography variant="small" className="truncate">
                          {company.industry}
                        </Typography>
                      )}
                      {company.industry && <span className="text-xs">·</span>}
                      <Typography variant="small">
                        {company.postingCount} {company.postingCount === 1 ? "job posting" : "job postings"}
                      </Typography>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(company)}>
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.name}` : undefined}
        className="max-w-lg"
      >
        {editing && (
          <CompanyForm company={editing} onSuccess={() => setEditing(null)} />
        )}
      </Dialog>

      <Dialog
        isOpen={creating}
        onClose={() => setCreating(false)}
        title="Create a company"
        className="max-w-lg"
      >
        <CompanyForm onSuccess={() => setCreating(false)} />
      </Dialog>
    </div>
  );
}
