import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db/client";
import { auth } from "@/features/auth/lib/auth";
import { userPreferences } from "@/features/auth/db/schema";
import featuresConfig from "@/features.config";
import type { ListQuery } from "@/jobs/lib/query-types";
import type { ExperienceLevelToken } from "@/lib/api/types";

const EXPERIENCE_TOKENS: ExperienceLevelToken[] = ["EN", "MI", "SE", "EX"];

/** The column is plain text[], so narrow it at read time rather than casting - a stale or hand-edited row shouldn't be able to inject a bogus filter value into an API call. */
function toExperienceTokens(values: string[]): ExperienceLevelToken[] {
  return values.filter((v): v is ExperienceLevelToken =>
    (EXPERIENCE_TOKENS as string[]).includes(v)
  );
}

/**
 * The current user's saved onboarding preferences expressed as a partial
 * job search, or null if there's nothing to apply (feature off, signed
 * out, never onboarded, or onboarded without picking anything).
 *
 * jobs/routes/JobsPage.tsx uses this to seed an EMPTY search only - the
 * moment a visitor sets any filter of their own, their params win
 * outright. See userPreferences' schema doc comment for why these are
 * defaults rather than locks.
 *
 * Returns null rather than throwing on any missing piece: the jobs page is
 * public and must render identically for signed-out visitors and for
 * deployments with onboarding disabled entirely.
 */
export async function getPreferredJobQuery(): Promise<Partial<ListQuery> | null> {
  // Gated on auth only, NOT on onboarding.enabled: preferences are also
  // editable from /preferences (which job-alerts owns), so a deployment
  // running alerts with the onboarding flow switched off would otherwise
  // let people edit preferences that silently never applied to the feed.
  if (!featuresConfig.auth.enabled) return null;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const db = requireDb();
  const [prefs] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1);
  if (!prefs) return null;

  const query: Partial<ListQuery> = {};
  // Only the first title: ListQuery's `title` is a single search string,
  // not a list. Sending several would need OR semantics the endpoint
  // doesn't offer, so the first interest seeds the feed and the rest stay
  // available as one-click filters in the UI.
  if (prefs.titles.length) query.title = prefs.titles[0];
  // Ids are derived from the stored GeoSuggest objects rather than kept as
  // separate columns - see userPreferences.locations' doc comment. Each
  // selection is classified by its most specific id, so picking a city
  // doesn't also broaden the search to its whole country.
  const cityIds = prefs.locations.filter((l) => l.city_id != null).map((l) => l.city_id!);
  const stateIds = prefs.locations
    .filter((l) => l.city_id == null && l.state_id != null)
    .map((l) => l.state_id!);
  const countryIds = prefs.locations
    .filter((l) => l.city_id == null && l.state_id == null && l.country_id != null)
    .map((l) => l.country_id!);
  if (cityIds.length) query.city_id = cityIds;
  if (stateIds.length) query.state_id = stateIds;
  if (countryIds.length) query.country_id = countryIds;
  if (prefs.remoteOnly) query.remote_only = true;
  const levels = toExperienceTokens(prefs.experienceLevels);
  if (levels.length) query.experience_level = levels;
  if (prefs.minSalary != null) query.min_salary = prefs.minSalary;

  return Object.keys(query).length > 0 ? query : null;
}

/**
 * The same preferences expressed as this app's own URL search params.
 *
 * JobsPage redirects a bare /jobs to /jobs?<these> rather than quietly
 * applying them server-side. That matters for more than tidiness: the
 * active-filter chips clear a filter by removing it from the URL, so a
 * filter that was never IN the URL renders a chip whose remove button
 * does nothing. Putting them in the URL makes the chips - and the whole
 * existing filter UI - work on preference-seeded filters for free.
 */
export async function getPreferredSearchParams(): Promise<URLSearchParams | null> {
  const query = await getPreferredJobQuery();
  if (!query) return null;

  const params = new URLSearchParams();
  if (query.title) params.set("title", query.title);
  if (query.city_id?.length) params.set("city_id", query.city_id.join(","));
  if (query.state_id?.length) params.set("state_id", query.state_id.join(","));
  if (query.country_id?.length) params.set("country_id", query.country_id.join(","));
  if (query.remote_only) params.set("remote", "true");
  if (query.experience_level?.length) params.set("experience_level", query.experience_level.join(","));
  // `salary` is a single "min,max" param (see query-mapper.ts) - preferences
  // only carry a floor, so the max half is left off.
  if (query.min_salary != null) params.set("salary", String(query.min_salary));

  return Array.from(params.keys()).length > 0 ? params : null;
}
