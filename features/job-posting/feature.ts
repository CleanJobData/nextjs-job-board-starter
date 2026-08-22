import type { FeaturePlugin } from "../registry";

/**
 * No providers, no cron tasks, no jobDetailActions (unlike applications,
 * job-posting doesn't add anything to an existing job's detail view - its
 * own postings show up as ordinary jobs via listJobsFromCache()'s
 * unification, see features/job-sync/lib/read.ts). Just a dashboard page
 * (features/job-posting/routes/job-postings/page.tsx) and server actions,
 * all gated by authGuard.ts's checkAccess() three-way check, same pattern
 * as every other feature.
 */
export const jobPostingFeature: FeaturePlugin = {
  key: "jobPosting",
  navItems: () => [{ label: "Post a Job", href: "/job-postings" }],
};
