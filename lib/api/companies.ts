import { apiFetch } from "./client";
import type { CompanyDetail } from "./types";

/**
 * The only endpoint with the full enrichment payload (socials, industry,
 * team, etc.) - one employer at a time, no batch variant. GET /companies
 * (the list/batch endpoint) never returns enrichment data regardless of
 * how it's filtered, so there's no cheaper alternative for getting real
 * company data - see features/job-sync/lib/companies.ts's
 * refreshStaleCompanies() for why we don't try to batch-check staleness
 * before calling this either.
 */
export async function getCompanyDetail(employerId: string): Promise<CompanyDetail> {
  return apiFetch<CompanyDetail>(`/companies/${employerId}`);
}
