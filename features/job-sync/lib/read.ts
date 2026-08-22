import { and, desc, eq, gte, ilike, lte, lt, or, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import type { ListQuery } from "@/jobs/lib/query-types";
import type { Company, FilterApplied, Job, JobDetail, ListResponse } from "@/lib/api/types";
import { jobs, companies } from "../db/schema";

/**
 * Cursor is opaque to callers (same contract as the live API's
 * pagination.next_page) - encodes a keyset position, not tied to the live
 * API's own cursor format. Safe because a deployment only ever exercises
 * one branch (cache or live) per request, per jobs/actions/jobs.ts.
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

type JobRow = typeof jobs.$inferSelect;
type CompanyRow = typeof companies.$inferSelect;

/**
 * Reassembles a Job (the ListResponse<Job> shape components expect) from our
 * columns + the optionally-joined company row. Inverse of sync.ts's
 * toJobRow()/upsertCompany().
 *
 * `id` is `row.externalId` for a source="cleanjobdata" row (job detail
 * pages/links round-trip that id straight into a live GET /jobs/:id call),
 * falling back to `row.id` (our internal nanoid) for source="posted" rows,
 * which have no externalId at all. JobDetailPage.tsx's getJobById() routing
 * is what makes this safe: it checks for a posted job under this id BEFORE
 * ever treating it as a CleanJobData id, so a posted job's `/jobs/[id]`
 * link always resolves to our own DB row instead of a live API 404.
 */
function toJob(row: JobRow, company: CompanyRow | null): Job {
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
    id: row.externalId ?? row.id,
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
  return or(...ids.map((id) => sql`${jobs.locations} @> ${JSON.stringify([{ [key]: id }])}::jsonb`));
}

/**
 * Serves listings from cached_jobs instead of the live CleanJobData API.
 * Used by jobs/actions/jobs.ts when features.config.ts's jobSync.enabled is
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
  // Both isActive and expiresAt apply uniformly to source="posted" rows
  // too: posted jobs default isActive=true and get a 90-day expiresAt at
  // insert (createJobPosting()), so the same "still live" semantics hold.
  //
  // Deliberately NO `eq(jobs.source, "cleanjobdata")` filter here (phase 2
  // removed it) - this function now serves the UNIFIED public feed: both
  // source="cleanjobdata" and source="posted" rows, so the homepage/search
  // results are one combined, correctly-paginated result set instead of two
  // separate feeds. What actually gates a posted job's visibility is the
  // status filter below, unconditionally:
  const conditions = [
    eq(jobs.isActive, true),
    gte(jobs.expiresAt, new Date()),
    // Unconditional, not a query option: a source="posted" job sitting at
    // status="pending" (awaiting admin moderation) or "rejected" must never
    // surface here regardless of what the caller asked for. Existing
    // source="cleanjobdata" rows are always status="approved" (the column
    // default), so this is a no-op for them.
    eq(jobs.status, "approved" as const),
  ];
  const filtersApplied: FilterApplied[] = [];

  if (query.title) {
    conditions.push(ilike(jobs.title, `%${query.title}%`));
    filtersApplied.push({ key: "title", value: query.title, display_label: `"${query.title}"` });
  }
  if (query.location?.length) {
    conditions.push(
      or(...query.location.map((loc) => ilike(jobs.locationText, `%${loc}%`)))!
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
    conditions.push(eq(jobs.hasRemote, true));
    filtersApplied.push({ key: "remote_only", value: true, display_label: "Remote Only" });
  }
  if (query.experience_level?.length) {
    conditions.push(sql`${jobs.experienceLevels} && ${query.experience_level}`);
    filtersApplied.push({
      key: "experience_level",
      value: query.experience_level.join(","),
      display_label: query.experience_level.join(", "),
    });
  }
  if (query.min_salary != null || query.max_salary != null) {
    if (query.min_salary != null) conditions.push(gte(jobs.salaryMax, query.min_salary));
    if (query.max_salary != null) conditions.push(lte(jobs.salaryMin, query.max_salary));
    filtersApplied.push({
      key: "salary",
      min: query.min_salary ?? null,
      max: query.max_salary ?? null,
      display_label: `Salary ${query.min_salary ?? "any"}-${query.max_salary ?? "any"}`,
    });
  }
  if (query.company_name) {
    conditions.push(ilike(jobs.companyName, `%${query.company_name}%`));
    filtersApplied.push({ key: "company_name", value: query.company_name, display_label: query.company_name });
  }
  if (query.published_after) {
    conditions.push(gte(jobs.published, new Date(query.published_after)));
    filtersApplied.push({ key: "published_after", value: query.published_after, display_label: "Recently published" });
  }
  if (query.max_age_hours) {
    const since = new Date(Date.now() - query.max_age_hours * 60 * 60 * 1000);
    conditions.push(gte(jobs.published, since));
    filtersApplied.push({ key: "max_age", value: query.max_age_hours, display_label: `Last ${query.max_age_hours}h` });
  }

  if (query.cursor) {
    const decoded = decodeCursor(query.cursor);
    if (decoded) {
      conditions.push(
        or(
          lt(jobs.published, new Date(decoded.p)),
          and(eq(jobs.published, new Date(decoded.p)), lt(jobs.id, decoded.id))
        )!
      );
    }
  }

  const rows = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(...conditions))
    .orderBy(desc(jobs.published), desc(jobs.id))
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

/**
 * Job detail's OWN read path for source="posted" jobs - deliberately NOT
 * routed through getJobById() (jobs/lib/api.ts), which always does a live
 * GET /jobs/:id round-trip against the CleanJobData API. A posted job has
 * no CleanJobData identity at all (externalId is null) - its full detail,
 * including `description`, already lives entirely in our own DB (see
 * jobs.description's doc comment), so there is nothing to fetch live.
 *
 * jobs/routes/JobDetailPage.tsx calls this FIRST for any `/jobs/[id]` hit;
 * only a miss here falls through to the live/cache CleanJobData path. This
 * is the "id-routing" piece the phase 2 spec calls out: a posted job's id
 * (an internal nanoid, from `jobs.id`) is never a valid CleanJobData id, so
 * checking here first is a pure narrowing that can't shadow real
 * CleanJobData ids (different id spaces entirely, and even in the unlikely
 * event of a collision, a nanoid(12) posted-job id matching a real
 * CleanJobData id string is not a real-world risk to guard against beyond
 * this comment).
 *
 * A pending/rejected posting does NOT resolve here (returns null, same as
 * a nonexistent id) - a posting isn't real to the outside world until an
 * admin approves it (or features.config.ts's jobPosting.requireVerification
 * is false, in which case createJobPosting() inserts it already
 * status="approved" and it's visible immediately). The poster can still see
 * their own pending/rejected postings and their status via the
 * "my postings" dashboard (getMyJobPostings(), a separate query that never
 * goes through this status-gated path) - only this direct-link/public path
 * is gated.
 */
export async function getPostedJobById(id: string): Promise<JobDetail | null> {
  const db = requireDb();
  const [row] = await db
    .select({ job: jobs, company: companies })
    .from(jobs)
    .leftJoin(companies, eq(jobs.companyId, companies.id))
    .where(and(eq(jobs.id, id), eq(jobs.source, "posted"), eq(jobs.status, "approved")))
    .limit(1);

  if (!row) return null;

  return { ...toJob(row.job, row.company), description: row.job.description };
}
