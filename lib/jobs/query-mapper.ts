import { ExperienceLevelToken } from "../api/types";
import {
  JobBoardSearchParams,
  ListQuery,
  SortBy,
} from "./query-types";

/**
 * Normalizes raw URL search parameters into a structured object.
 */
export function normalizeSearchParams(
  params: any
): JobBoardSearchParams {
  const getSingle = (key: string) => {
    const val = params[key];
    return Array.isArray(val) ? val[0] : val;
  };

  return {
    title: getSingle("title"),
    location: getSingle("location"),
    city_id: getSingle("city_id"),
    state_id: getSingle("state_id"),
    country_id: getSingle("country_id"),
    remote: getSingle("remote"),
    experience_level: getSingle("experience_level"),
    salary: getSingle("salary"),
    max_age: getSingle("max_age"),
    sort_by: getSingle("sort_by"),
    cursor: getSingle("cursor"),
    limit: getSingle("limit"),
  };
}

/**
 * Maps application search parameters to the backend API format.
 */
export function mapSearchParamsToQuery(params: JobBoardSearchParams): ListQuery {
  const query: ListQuery = {};

  if (params.title) {
    query.title = params.title;
  }

  if (params.city_id) {
    query.city_id = params.city_id.split(",").map(Number).filter(n => !isNaN(n));
  }
  if (params.state_id) {
    query.state_id = params.state_id.split(",").map(Number).filter(n => !isNaN(n));
  }
  if (params.country_id) {
    query.country_id = params.country_id.split(",").map(Number).filter(n => !isNaN(n));
  }

  if (params.location && !params.city_id && !params.state_id && !params.country_id) {
    const codes = params.location
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{2}$/.test(s));
    if (codes.length > 0) {
      query.location = codes;
    }
  }

  if (params.remote === "true" || params.remote === "remote_only") {
    query.remote_only = true;
  }

  if (params.experience_level) {
    const levels = params.experience_level
      .split(",")
      .map((s) => s.trim().toUpperCase()) as ExperienceLevelToken[];
    const validLevels: ExperienceLevelToken[] = ["EN", "MI", "SE", "EX"];
    query.experience_level = levels.filter((l) => validLevels.includes(l));
  }

  if (params.salary) {
    const parts = params.salary.split(",").map(Number);
    if (!isNaN(parts[0]!)) {
      query.min_salary = parts[0];
      if (parts[1] !== undefined && !isNaN(parts[1])) {
        query.max_salary = parts[1];
      }
    }
  }

  if (params.max_age) {
    const match = params.max_age.match(/^(\d+)([hdw])?$/);
    if (match) {
      const value = parseInt(match[1]!, 10);
      const unit = match[2] || "d";
      let hours = value;
      if (unit === "d") hours = value * 24;
      else if (unit === "w") hours = value * 24 * 7;
      query.max_age_hours = hours;
    }
  }

  if (params.sort_by === "published" || params.sort_by === "relevance") {
    query.sort_by = params.sort_by as SortBy;
  }

  if (params.cursor) {
    query.cursor = params.cursor;
  }

  if (params.limit) {
    const limit = parseInt(params.limit, 10);
    if (!isNaN(limit)) {
      query.limit = limit;
    }
  }

  return query;
}

/**
 * Converts a ListQuery object into URLSearchParams for the API request.
 */
export function buildApiUrlParams(query: ListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (query.title) params.set("title", query.title);
  if (query.city_id?.length) params.set("city_id", query.city_id.join(","));
  if (query.state_id?.length) params.set("state_id", query.state_id.join(","));
  if (query.country_id?.length) params.set("country_id", query.country_id.join(","));
  if (query.location?.length) params.set("location", query.location.join(","));
  
  if (query.remote_only) params.set("workSetting", "remote_only");
  
  if (query.experience_level?.length) {
    params.set("experience_level", query.experience_level.join(","));
  }

  if (query.min_salary || query.max_salary) {
    const min = query.min_salary || "";
    const max = query.max_salary || "";
    params.set("salary", `${min},${max}`);
  }

  if (query.max_age_hours) params.set("max_age", `${query.max_age_hours}h`);
  if (query.published_after) params.set("published_after", query.published_after);
  if (query.company_name) params.set("company_name", query.company_name);
  if (query.sort_by) params.set("sort_by", query.sort_by);
  if (query.cursor) params.set("cursor", query.cursor);
  if (query.limit) params.set("limit", query.limit.toString());

  if (query.fields) params.set("fields", query.fields);
  if (query.exclude_fields) params.set("exclude_fields", query.exclude_fields);
  if (query.extra_fields) params.set("extra_fields", query.extra_fields);

  return params;
}
