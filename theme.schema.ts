import { z } from "zod";

/**
 * Selectable design surface for the app's central theming system.
 * See docs/ARCHITECTURE.md for how these values flow into app/globals.css
 * and styles/presets/*.css.
 */
export const themeSchema = z.object({
  /** Which token preset to load on top of app/globals.css defaults. "custom" skips presets entirely. */
  preset: z.enum(["default", "warm", "minimal-mono", "custom"]).default("default"),
  /** Which next/font family to load app-wide. */
  font: z.enum(["geist", "inter"]).default("geist"),
  /** Base corner radius in rem, used to derive --radius-sm/md/lg. */
  radius: z.number().min(0).max(2).default(0.75),
  /** Spacing density affects component internal padding via --spacing-card etc. */
  density: z.enum(["compact", "comfortable"]).default("comfortable"),
  /** Default color mode shown before the user picks one; user choice still overrides via ThemeProvider. */
  defaultMode: z.enum(["light", "dark", "system"]).default("system"),
});

export type ThemeConfig = z.infer<typeof themeSchema>;
