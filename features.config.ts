import { featuresSchema, type FeaturesConfig } from "./features.schema";

/**
 * Single source of truth for which optional features this deployment has
 * turned on. This is the exact file a future CleanJobData feature picker
 * would generate and drop into a cloned repo — edit values, don't add logic.
 *
 * All features start disabled: none of the features/<name>/ folders exist
 * yet, so there is nothing to turn on. Flip a flag to `true` only once its
 * feature module has been built and registered in features/registry.ts.
 */
const config: FeaturesConfig = {
  auth: { enabled: true, credentials: true, oauthProviders: [], emailVerification: false },
  jobSync: { enabled: true, guestAccess: true },
  resume: { enabled: true, guestAccess: false, parsing: true, aiParsing: false },
  applications: { enabled: true, guestAccess: false },
  jobPosting: { enabled: true, guestAccess: false, requireVerification: true },
  admin: { enabled: true },
  jobAlerts: { enabled: true },
  onboarding: { enabled: true },
};

export default featuresSchema.parse(config);
