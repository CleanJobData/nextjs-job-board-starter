import type { FeaturePlugin } from "../registry";

/** No cron tasks or providers - resumes are entirely user-driven; the nav link is the only shell integration. */
export const resumeFeature: FeaturePlugin = {
  key: "resume",
  navItems: () => [{ label: "Resumes", href: "/resume" }],
};
