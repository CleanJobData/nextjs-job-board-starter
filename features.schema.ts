import { z } from "zod";

/**
 * One entry per optional feature. `enabled` turns the feature's routes/nav/db
 * on or off; `guestAccess` (where applicable) controls whether a signed-out
 * visitor can use it. See docs/ARCHITECTURE.md for how this flows into
 * features/registry.ts and per-feature route shims under app/.
 *
 * guestAccess is meaningless when auth.enabled is false — everything is
 * guest-accessible in that case regardless of these values.
 */
export const featuresSchema = z.object({
  auth: z.object({
    enabled: z.boolean().default(false),
    provider: z.enum(["credentials", "oauth"]).default("credentials"),
  }),
  jobSync: z.object({
    enabled: z.boolean().default(false),
    guestAccess: z.boolean().default(true),
    cron: z.boolean().default(false),
    ttlHours: z.number().default(72),
  }),
  resume: z.object({
    enabled: z.boolean().default(false),
    guestAccess: z.boolean().default(false),
    parsing: z.boolean().default(true),
    aiParsing: z.boolean().default(false),
  }),
  applications: z.object({
    enabled: z.boolean().default(false),
    guestAccess: z.literal(false).default(false),
  }),
  jobPosting: z.object({
    enabled: z.boolean().default(false),
    guestAccess: z.boolean().default(false),
  }),
});

export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type FeatureKey = keyof FeaturesConfig;
