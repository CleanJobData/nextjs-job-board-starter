/**
 * CleanJobData API — Core TypeScript Definitions
 */

export interface JobListPagination {
  limit: number;
  next_page: string | null;
  prev_page: string | null;
}

/** Human-readable echo of filters the server applied */
export type FilterApplied =
  | { key: "title"; value: string; display_label: string }
  | { key: "experience_level"; value: string; display_label: string }
  | { key: "salary"; min: number | null; max: number | null; display_label: string }
  | { key: "published_after"; value: string; display_label: string }
  | { key: "max_age"; value: number; display_label: string }
  | { key: "city_id"; kind: "city"; name: string; display_label: string; city_id: number }
  | { key: "state_id"; kind: "state"; name: string; display_label: string; state_id: number }
  | { key: "country_id"; kind: "country"; name: string; display_label: string; country_id: number }
  | { key: "location"; value: string; display_label: string }
  | { key: "remote_only"; value: true; display_label: "Remote Only" }
  | { key: "company_name"; value: string; display_label: string };

export interface JobListMeta {
  query_time_ms: number;
  filters_applied: FilterApplied[];
}

export interface ListResponse<T = Job> {
  data: T[];
  pagination: JobListPagination;
  meta: JobListMeta;
}

/** Canonical seniority tokens (Entry / Mid / Senior / Executive) */
export type ExperienceLevelToken = "EN" | "MI" | "SE" | "EX";

export interface CompanyTeamMember {
  name: string | null;
  title: string | null;
  linkedin_url: string | null;
  photo_url: string | null;
}

export interface Company {
  name: string;
  description: string | null;
  logo: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  github_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  team: CompanyTeamMember[];
  employee_count: string | number | null;
  industry: string | null;
  headquarters: string | null;
  founded: number | null;
  specialties: string[] | null;
  location: string | null;
  registrableDomain: string | null;
}

export interface Location {
  kind: string | null;
  is_primary: boolean;
  city_id: number | null;
  city_name: string | null;
  state_id: number | null;
  state_name: string | null;
  state_code: string | null;
  country_id: number | null;
  country_name: string | null;
  country_code: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
  is_remote?: boolean;
}

export interface Job {
  id: string;
  title: string;
  location: string | null;
  locations: Location[] | null;
  application_url: string | null;
  published: string;
  has_remote: boolean;
  is_active: boolean;
  expired_at: string | null;
  language: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_text: string | null;
  experience_level: ExperienceLevelToken | null;
  experience_levels: ExperienceLevelToken[];
  /** Stable employer id, joinable against GET /companies. Public-tier API keys get this field name. */
  employer_id?: string | null;
  /**
   * Same value, different field name - internal-tier API keys (e.g. this
   * repo's own .env during development) get `ats_employer_id` instead of
   * `employer_id`. Real customer deployments use public-tier keys and will
   * only ever see `employer_id` - this field exists purely so this
   * template's own dev/test environment can exercise the company-sync
   * code path. See features/job-sync/lib/companies.ts's getEmployerId().
   */
  ats_employer_id?: string | null;
  company: Company | null;
}

export interface JobDetail extends Job {
  description: string | null;
}

/** GET /companies list item (also what ?employer_id=a,b,c returns) - deliberately thin, no enrichment data. Cheap to fetch in bulk for staleness checks. */
export interface CompanySummary {
  id: string;
  display_name: string;
  website_url: string | null;
  logo_url: string | null;
  last_job_count: number;
  last_scraped_at: string;
}

export interface CompanyEnrichmentSocial {
  linkedin: string | null;
  twitter: string | null;
  github: string | null;
  youtube: string | null;
  facebook: string | null;
  instagram: string | null;
}

export interface CompanyEnrichmentMeta {
  name: string;
  logoUrl: string | null;
  iconUrl: string | null;
  description: string | null;
  employee_count: string | number | null;
  industry: string | null;
  headquarters: string | null;
  /** A string on this endpoint, unlike Company.founded's number - CleanJobData doesn't normalize it here. */
  founded: string | null;
  /** A comma-separated string here, unlike Company.specialties' array - CleanJobData doesn't normalize it here. */
  specialties: string | null;
  location: string | null;
}

/** GET /companies/:id - the only endpoint with the full enrichment payload; the list/batch endpoint doesn't include it. */
export interface CompanyDetail extends CompanySummary {
  website_enrichment: {
    registrableDomain: string | null;
    social: CompanyEnrichmentSocial;
    meta: CompanyEnrichmentMeta;
    team: CompanyTeamMember[];
  } | null;
  is_active: boolean;
  created_at: string;
}

/** GET /jobs/expired item - deliberately minimal (backend only returns id + expired_at, not a full job object). */
export interface ExpiredJobItem {
  id: string;
  expired_at: string;
}

/** GET /jobs/expired response - a simpler envelope than ListResponse<Job>: no `meta`, cursor is numeric/opaque (not the keyset cursor /jobs uses). */
export interface ExpiredJobsResponse {
  data: ExpiredJobItem[];
  pagination: {
    limit: number;
    next_cursor: string | null;
  };
}

/**
 * GET /geo/suggest now returns the full ancestor chain for every result,
 * not just the matched level's own id - a city hit includes its
 * state_id/country_id (and vice versa isn't applicable, but a state hit
 * still includes country_id), with null for whichever fields don't apply
 * to that result's `kind`. This used to be a flat "just the matched id"
 * shape (GeoSuggestCityResult/StateResult/CountryResult, each carrying
 * only its own id) - CleanJobData's backend was expanded specifically to
 * fix a real gap: picking only a city left state_id/country_id
 * unresolvable client-side, so a job posted with a city-only location
 * could never be found by a seeker filtering on country. Shape now
 * mirrors `Location` almost exactly (see toLocations() in
 * features/job-posting/actions/job-postings.ts, the shape this feeds).
 */
export interface GeoSuggestResult {
  kind: "city" | "state" | "country";
  name: string;
  display_label: string;
  city_id: number | null;
  city_name: string | null;
  state_id: number | null;
  state_name: string | null;
  state_code: string | null;
  country_id: number | null;
  country_name: string | null;
  country_code: string | null;
  region: string | null;
  subregion: string | null;
  lat: number | null;
  lng: number | null;
  timezone: string | null;
}

export interface ApiErrorBody {
  status: number;
  message: string;
  code?: string;
}
