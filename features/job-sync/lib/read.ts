import { and, desc, eq, gte, ilike, lte, lt, or, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import type { ListQuery } from "@/lib/jobs/query-types";
import type { Company, FilterApplied, Job, ListResponse } from "@/lib/api/types";
import { cachedJobs, companies } from "../db/schema";

/**
 * Cursor is opaque to callers (same contract as the live API's
 * pagination.next_page) - encodes a keyset position, not tied to the live
 * API's own cursor format. Safe because a deployment only ever exercises
 * one branch (cache or live) per request, per app/actions/jobs.ts.
 */
function encodeCursor(published: Date, id: string) {
  return Buffer.from(JSON.stringify({ p: published.toISOString(), id })).toString("base64url");
}

function decodeCursor(cursor: string): { p: string; id: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

type CachedJobRow = typeof cachedJobs.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;

/** Reassembles a Job (the ListResponse<Job> shape components expect) from our columns + the optionally-joined company row. Inverse of sync.ts's toJobRow()/upsertCompany(). */
function toJob(row: CachedJobRow, company: CompanyRow | null): Job {
  const companyObj: Company | null = company
    ? {
        name: company.name,
        description: company.description,
        logo: company.logo,
        website_url: company.websiteUrl,
        linkedin_url: company.linkedinUrl,
        twitter_url: company.twitterUrl,
        github_url: company.githubUrl,
        youtube_url: company.youtubeUrl,
        facebook_url: company.facebookUrl,
        instagram_url: company.instagramUrl,
        team: company.team,
        employee_count: company.employeeCount,
        industry: company.industry,
        headquarters: company.headquarters,
        founded: company.founded,
        specialties: company.specialties,
        location: company.location,
        registrableDomain: company.registrableDomain,
      }
    : null;

  return {
    id: row.id,
    title: row.title,
    location: row.locationText,
    locations: row.locations,
    application_url: row.applicationUrl,
    published: row.published.toISOString(),
    has_remote: row.hasRemote,
    is_active: row.isActive,
    expired_at: row.sourceExpiredAt ? row.sourceExpiredAt.toISOString() : null,
    language: row.language,
    employment_type: row.employmentType,
    salary_min: row.salaryMin,
    salary_max: row.salaryMax,
    salary_currency: row.salaryCurrency,
    salary_text: row.salaryText,
    experience_level: row.experienceLevel as Job["experience_level"],
    experience_levels: row.experienceLevels as Job["experience_levels"],
    company: companyObj,
  };
}

/** JSONB containment: matches any location in the array having this key=value - index-backed via cached_jobs_locations_gin_idx, no child table needed. */
function locationContains(key: "city_id" | "state_id" | "country_id", ids: number[]) {
  return or(...ids.map((id) => sql`${cachedJobs.locations} @> ${JSON.stringify([{ [key]: id }])}::jsonb`));
}

/**
 * Serves listings from cached_jobs instead of the live CleanJobData API.
 * Used by app/actions/jobs.ts when features.config.ts's jobSync.enabled is
 * true. Unlike the previous version, city_id/state_id/country_id ARE
 * supported now, via GIN-indexed containment queries against the full
 * `locations` JSONB array (a job can have multiple locations - this
 * matches any of them, not just a "primary" one).
 */
export async function listJobsFromCache(query: ListQuery = {}): Promise<ListResponse<Job>> {
  const start = Date.now();
  const db = requireDb();
  const limit = query.limit ?? 20;

  // isActive is the real signal (flipped by pollExpiredJobs()); expiresAt is
  // only the backstop TTL, but we still filter on it here too, not just at
  // prune time - a row can be past its backstop and not yet swept by the
  // next expired_check run, and it shouldn't render as "active" meanwhile.
  const conditions = [eq(cachedJobs.isActive, true), gte(cachedJobs.expiresAt, new Date())];
  const filtersApplied: FilterApplied[] = [];

  if (query.title) {
    conditions.push(ilike(cachedJobs.title, `%${query.title}%`));
    filtersApplied.push({ key: "title", value: query.title, display_label: `"${query.title}"` });
  }
  if (query.location?.length) {
    conditions.push(
      or(...query.location.map((loc) => ilike(cachedJobs.locationText, `%${loc}%`)))!
    );
    filtersApplied.push({ key: "location", value: query.location.join(", "), display_label: query.location.join(", ") });
  }
  if (query.city_id?.length) {
    conditions.push(locationContains("city_id", query.city_id)!);
    filtersApplied.push({ key: "city_id", kind: "city", name: "", display_label: `${query.city_id.length} cit${query.city_id.length === 1 ? "y" : "ies"}`, city_id: query.city_id[0]! });
  }
  if (query.state_id?.length) {
    conditions.push(locationContains("state_id", query.state_id)!);
    filtersApplied.push({ key: "state_id", kind: "state", name: "", display_label: `${query.state_id.length} state${query.state_id.length === 1 ? "" : "s"}`, state_id: query.state_id[0]! });
  }
  if (query.country_id?.length) {
    conditions.push(locationContains("country_id", query.country_id)!);
    filtersApplied.push({ key: "country_id", kind: "country", name: "", display_label: `${query.country_id.length} countr${query.country_id.length === 1 ? "y" : "ies"}`, country_id: query.country_id[0]! });
  }
  if (query.remote_only) {
    conditions.push(eq(cachedJobs.hasRemote, true));
    filtersApplied.push({ key: "remote_only", value: true, display_label: "Remote Only" });
  }
  if (query.experience_level?.length) {
    conditions.push(sql`${cachedJobs.experienceLevels} && ${query.experience_level}`);
    filtersApplied.push({
      key: "experience_level",
      value: query.experience_level.join(","),
      display_label: query.experience_level.join(", "),
    });
  }
  if (query.min_salary != null || query.max_salary != null) {
    if (query.min_salary != null) conditions.push(gte(cachedJobs.salaryMax, query.min_salary));
    if (query.max_salary != null) conditions.push(lte(cachedJobs.salaryMin, query.max_salary));
    filtersApplied.push({
      key: "salary",
      min: query.min_salary ?? null,
      max: query.max_salary ?? null,
      display_label: `Salary ${query.min_salary ?? "any"}-${query.max_salary ?? "any"}`,
    });
  }
  if (query.company_name) {
    conditions.push(ilike(cachedJobs.companyName, `%${query.company_name}%`));
    filtersApplied.push({ key: "company_name", value: query.company_name, display_label: query.company_name });
  }
  if (query.published_after) {
    conditions.push(gte(cachedJobs.published, new Date(query.published_after)));
    filtersApplied.push({ key: "published_after", value: query.published_after, display_label: "Recently published" });
  }
  if (query.max_age_hours) {
    const since = new Date(Date.now() - query.max_age_hours * 60 * 60 * 1000);
    conditions.push(gte(cachedJobs.published, since));
    filtersApplied.push({ key: "max_age", value: query.max_age_hours, display_label: `Last ${query.max_age_hours}h` });
  }

  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      conditions.push(
        or(
          lt(cachedJobs.published, new Date(decoded.p)),
          and(eq(cachedJobs.published, new Date(decoded.p)), lt(cachedJobs.id, decoded.id))
        )!
      );
    }
  }

  const rows = await db
    .select({ job: cachedJobs, company: companies })
    .from(cachedJobs)
    .leftJoin(companies, eq(cachedJobs.companyId, companies.id))
    .where(and(...conditions))
    .orderBy(desc(cachedJobs.published), desc(cachedJobs.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page[page.length - 1];

  return {
    data: page.map((r) => toJob(r.job, r.company)),
    pagination: {
      limit,
      next_page: hasMore && last ? encodeCursor(last.job.published, last.job.id) : null,
      prev_page: null,
    },
    meta: {
      query_time_ms: Date.now() - start,
      filters_applied: filtersApplied,
    },
  };
}
