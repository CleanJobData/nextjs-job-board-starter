import { themeSchema, type ThemeConfig } from "./theme.schema";

/**
 * Single source of truth for this deployment's design theme.
 * This is the exact file a future CleanJobData theme picker would
 * generate and drop into a cloned repo — edit values, don't add logic.
 */
const config: ThemeConfig = {
  preset: "default",
  font: "geist",
  radius: 0.75,
  density: "comfortable",
  defaultMode: "system",
};

export default themeSchema.parse(config);
