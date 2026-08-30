import type { FeaturePlugin } from "../registry";
import { AuthSessionProvider } from "./components/AuthSessionProvider";

export const authFeature: FeaturePlugin = {
  key: "auth",
  // No navItems() here anymore - "Sign In" needs to disappear once a
  // session exists (and a sign-out control needs to appear instead), but
  // navItems() composes once, statically, at module-eval time with no
  // access to per-request session state (see registry.ts's activeNavItems).
  // SiteHeader.tsx now resolves this itself via a real `auth()` call.
  providers: [AuthSessionProvider],
};
