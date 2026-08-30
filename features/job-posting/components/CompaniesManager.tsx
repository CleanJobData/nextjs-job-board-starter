"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Typography } from "@/components/ui/Typography";
import { CompanyForm } from "./CompanyForm";

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  websiteUrl: string | null;
  industry: string | null;
  headquarters: string | null;
  logo: string | null;
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
      {companies.length === 0 ? (
        <Typography className="text-muted-foreground">
          You don&apos;t have any companies yet.
        </Typography>
      ) : (
        <div className="space-y-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  {company.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logo}
                      alt=""
                      className="h-10 w-10 rounded object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Typography className="font-medium truncate">{company.name}</Typography>
                    {company.industry && (
                      <Typography variant="small" className="text-muted-foreground truncate">
                        {company.industry}
                      </Typography>
                    )}
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

      <Button variant="secondary" onClick={() => setCreating(true)}>
        Add another company
      </Button>

      <Dialog isOpen={!!editing} onClose={() => setEditing(null)} className="max-w-lg">
        {editing && (
          <CompanyForm company={editing} onSuccess={() => setEditing(null)} />
        )}
      </Dialog>

      <Dialog isOpen={creating} onClose={() => setCreating(false)} className="max-w-lg">
        <CompanyForm onSuccess={() => setCreating(false)} />
      </Dialog>
    </div>
  );
}
