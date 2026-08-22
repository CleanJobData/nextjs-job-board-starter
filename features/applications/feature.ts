import type { FeaturePlugin } from "../registry";
import { JobDetailTrackAction } from "./components/JobDetailTrackAction";

/** No providers, no cron tasks - just a dashboard page, a "Track this job" button on job detail views, and server actions - all gated by authGuard.ts's checkAccess() three-way check. */
export const applicationsFeature: FeaturePlugin = {
  key: "applications",
  navItems: () => [{ label: "My Applications", href: "/applications" }],
  jobDetailActions: () => [JobDetailTrackAction],
};
