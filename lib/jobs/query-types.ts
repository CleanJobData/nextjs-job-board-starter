import { ExperienceLevelToken } from "../api/types";

export type SortBy = "published" | "relevance";

export type MaxAgePreset = "24h" | "7d" | "30d";

/**
 * Raw URL search parameters from the browser.
 */
export interface JobBoardSearchParams {
  title?: string;
  location?: string;
  city_id?: string;
  state_id?: string;
  country_id?: string;
  remote?: string;
  experience_level?: string;
  salary?: string;
  max_age?: string;
  sort_by?: string;
  cursor?: string;
  limit?: string;
}

/**
 * Normalized query object for the Jobs API.
 */
export type RemoteType = "fully_remote" | "remote_country" | "remote_region" | "hybrid";

export type EmploymentType =
  | "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | "TEMPORARY"
  | "FREELANCE" | "APPRENTICESHIP" | "VOLUNTEER" | "PER_DIEM" | "OTHER";

export interface ListQuery {
  title?: string;
  city_id?: number[];
  state_id?: number[];
  country_id?: number[];
  location?: string[];
  remote_only?: boolean;
  /** One of the backend's 4 remote sub-types - independent of remote_only. */
  remote_type?: RemoteType;
  experience_level?: ExperienceLevelToken[];
  employment_type?: EmploymentType[];
  min_salary?: number;
  max_salary?: number;
  /** Only takes effect when min_salary is also set (backend-side dependency). */
  require_salary?: boolean;
  max_age_hours?: number;
  /** Duration string (e.g. "30d") - jobs created after this window, distinct from published_after/max_age_hours which filter on `published`. */
  created_max_age?: string;
  published_after?: string;
  company_name?: string;
  company_website_url?: string;
  /** The job's internal source/ATS-board domain - NOT the company's website domain (that's company_website_url). Niche/technical, verified against real data that it does not match company domains. */
  source_domain?: string;
  /** CleanJobData's own employer id, not human-guessable - see features/job-sync/lib/companies.ts's getEmployerId(). */
  employer_id?: string[];
  /** Include remote jobs with no resolved country, which a location filter would otherwise exclude. */
  include_remote_without_country?: boolean;
  sort_by?: SortBy;
  cursor?: string;
  limit?: number;

  // Advanced field selection
  fields?: string;
  exclude_fields?: string;
  extra_fields?: string;
}
