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
  company: Company | null;
}

export interface JobDetail extends Job {
  description: string | null;
}

export interface GeoSuggestCityResult {
  kind: "city";
  name: string;
  display_label: string;
  city_id: number;
}

export interface GeoSuggestStateResult {
  kind: "state";
  name: string;
  display_label: string;
  state_id: number;
}

export interface GeoSuggestCountryResult {
  kind: "country";
  name: string;
  display_label: string;
  country_id: number;
}

export type GeoSuggestResult =
  | GeoSuggestCityResult
  | GeoSuggestStateResult
  | GeoSuggestCountryResult;

export interface ApiErrorBody {
  status: number;
  message: string;
  code?: string;
}
