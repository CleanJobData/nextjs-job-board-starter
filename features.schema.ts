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
    /** Email/password sign-in. Independent of oauthProviders so both can be on at once. */
    credentials: z.boolean().default(true),
    /** Which OAuth providers to wire up - each needs its own AUTH_<PROVIDER>_ID/SECRET env vars, see features/auth/README.md. */
    oauthProviders: z.array(z.enum(["google", "linkedin"])).default([]),
    /** Requires an email-sending setup - see features/auth/README.md before enabling. */
    emailVerification: z.boolean().default(false),
  }),
  jobSync: z.object({
    enabled: z.boolean().default(false),
    guestAccess: z.boolean().default(true),
    /** Sync cadence/page-size/expiry tuning lives in features/job-sync/job-sync.config.ts, not here - implementation detail of one feature, not a cross-cutting flag. */
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
    /** When true (default), a new posting starts status="pending" and stays invisible - even at its own direct /jobs/[id] link - until an admin approves it. When false, postings auto-publish as status="approved" immediately, for deployments that don't want a moderation step at all. */
    requireVerification: z.boolean().default(true),
  }),
  admin: z.object({
    enabled: z.boolean().default(false),
    /**
     * No `guestAccess` here, unlike every other feature above - admin access
     * isn't a per-visitor guest/auth split, it's a per-user `role` check
     * (features/authGuard.ts's requireAdmin(), which queries users.role
     * straight from the DB). `enabled` still works as a real off-switch:
     * false hides the whole /admin route group behind notFound() even for
     * an actual admin, same as every other feature's shim pattern - it just
     * doesn't compose with guestAccess the way the others do.
     */
  }),
  jobAlerts: z.object({
    enabled: z.boolean().default(false),
    /**
     * No `guestAccess`: an alert is emailed to a specific account, so it
     * has no meaningful signed-out mode. Reuses userPreferences (see
     * features/auth/db/schema.ts) as its criteria rather than storing a
     * second copy of the same filters, and needs a working mailer plus a
     * scheduler hitting /api/cron - see features/job-alerts/README.md.
     */
  }),
  onboarding: z.object({
    enabled: z.boolean().default(false),
    /**
     * No `guestAccess` here either, but for a different reason than admin's:
     * this isn't skipped because it's a role check instead of a guest/auth
     * split, it's skipped because there's no scenario where it applies to a
     * guest at all - the step only ever appears immediately after a
     * successful sign-up, for the account that was just created, matching
     * applications' `guestAccess: z.literal(false)` reasoning (a feature
     * that is inherently about an authenticated user's own data has no
     * guest-accessible mode to toggle). Deliberately simple v1 (see
     * features/auth/db/schema.ts's `accountType` column doc comment): one
     * inline "Job Seeker / Employer / Skip" choice, not a multi-step wizard
     * or a standalone gated route - a future pass could grow this into a
     * real feature module if onboarding ever needs more than one step.
     */
  }),
});

export type FeaturesConfig = z.infer<typeof featuresSchema>;
export type FeatureKey = keyof FeaturesConfig;
