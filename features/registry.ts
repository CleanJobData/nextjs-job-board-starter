import type { ComponentType, ReactNode } from "react";
import config from "@/features.config";
import type { FeatureKey } from "@/features.schema";
import type { CronTask } from "@/lib/cron/types";
import type { Job } from "@/lib/api/types";
import { authFeature } from "./auth/feature";
import { jobSyncFeature } from "./job-sync/feature";
import { applicationsFeature } from "./applications/feature";
import { jobPostingFeature } from "./job-posting/feature";
import { adminFeature } from "./admin/feature";

export type NavItem = {
  label: string;
  href: string;
};

/**
 * What a feature module under features/<name>/feature.ts exports so
 * shared shell code (SiteHeader, RootLayout, the cron route) can pick it
 * up without knowing anything about the feature's internals.
 */
export interface FeaturePlugin {
  key: FeatureKey;
  /** Nav links to show in SiteHeader when this feature is active. */
  navItems?: () => NavItem[];
  /** Context providers to wrap the app in when this feature is active (e.g. an auth session provider). */
  providers?: ComponentType<{ children: ReactNode }>[];
  /** Scheduled tasks this feature needs run periodically - picked up by app/api/cron/route.ts. See features/job-sync/feature.ts for a real example. */
  cronTasks?: () => CronTask[];
  /**
   * Extra actions to render on a job's detail view (components/jobs/JobDetailView.tsx),
   * e.g. applications' "Track this job" button. Keeps core job UI from ever
   * importing a specific feature's components directly - it only imports
   * this registry, which always exists regardless of which features are
   * installed, so deleting a feature never breaks JobDetailView.tsx.
   */
  jobDetailActions?: () => ComponentType<{ job: Job }>[];
}

/**
 * Every feature module registers itself here once it exists under
 * features/<name>/. Only auth is built so far; the rest register here
 * as they're built (job-sync, resume, applications, job-posting).
 */
const allFeaturePlugins: Partial<Record<FeatureKey, FeaturePlugin>> = {
  auth: authFeature,
  jobSync: jobSyncFeature,
  applications: applicationsFeature,
  jobPosting: jobPostingFeature,
  admin: adminFeature,
};

/** Plugins for every feature that is both registered above AND enabled in features.config.ts. */
export const activeFeatures: FeaturePlugin[] = Object.values(allFeaturePlugins).filter(
  (plugin): plugin is FeaturePlugin => plugin !== undefined && config[plugin.key].enabled
);

export function isFeatureEnabled(key: FeatureKey): boolean {
  return config[key].enabled;
}

export const activeNavItems: NavItem[] = activeFeatures.flatMap((f) => f.navItems?.() ?? []);

export const activeProviders: ComponentType<{ children: ReactNode }>[] = activeFeatures.flatMap(
  (f) => f.providers ?? []
);

export const activeCronTasks: CronTask[] = activeFeatures.flatMap((f) => f.cronTasks?.() ?? []);

export const activeJobDetailActions: ComponentType<{ job: Job }>[] = activeFeatures.flatMap(
  (f) => f.jobDetailActions?.() ?? []
);
