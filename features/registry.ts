import type { ComponentType, ReactNode } from "react";
import config from "@/features.config";
import type { FeatureKey } from "@/features.schema";

export type NavItem = {
  label: string;
  href: string;
};

/**
 * What a feature module under features/<name>/feature.ts exports so
 * shared shell code (SiteHeader, RootLayout) can pick it up without
 * knowing anything about the feature's internals.
 */
export interface FeaturePlugin {
  key: FeatureKey;
  /** Nav links to show in SiteHeader when this feature is active. */
  navItems?: () => NavItem[];
  /** Context providers to wrap the app in when this feature is active (e.g. an auth session provider). */
  providers?: ComponentType<{ children: ReactNode }>[];
}

/**
 * Every feature module registers itself here once it exists under
 * features/<name>/. Empty for now — no feature folders have been built
 * yet, so there is nothing to compose. This file's job is just to prove
 * the wiring: features.config.ts -> registry -> SiteHeader/layout.tsx.
 */
const allFeaturePlugins: Partial<Record<FeatureKey, FeaturePlugin>> = {};

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
