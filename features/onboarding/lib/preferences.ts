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
  if (!featuresConfig.onboarding.enabled || !featuresConfig.auth.enabled) return null;

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
  if (prefs.cityIds.length) query.city_id = prefs.cityIds;
  if (prefs.stateIds.length) query.state_id = prefs.stateIds;
  if (prefs.countryIds.length) query.country_id = prefs.countryIds;
  if (prefs.remoteOnly) query.remote_only = true;
  const levels = toExperienceTokens(prefs.experienceLevels);
  if (levels.length) query.experience_level = levels;
  if (prefs.minSalary != null) query.min_salary = prefs.minSalary;

  return Object.keys(query).length > 0 ? query : null;
}
