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
export interface ListQuery {
  title?: string;
  city_id?: number[];
  state_id?: number[];
  country_id?: number[];
  location?: string[];
  remote_only?: boolean;
  experience_level?: ExperienceLevelToken[];
  min_salary?: number;
  max_salary?: number;
  max_age_hours?: number;
  published_after?: string;
  company_name?: string;
  sort_by?: SortBy;
  cursor?: string;
  limit?: number;
  
  // Advanced field selection
  fields?: string;
  exclude_fields?: string;
  extra_fields?: string;
}
