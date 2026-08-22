import type { FeaturePlugin } from "../registry";

/**
 * No `navItems()` - unlike every other feature, admin access is gated by
 * `role`, not by whether the feature/visitor combination allows it
 * (checkAccess()'s three-way shape). navItems() composes statically at
 * registry.ts's module-eval time with zero access to the current
 * session/request, so there is no way to conditionally show an "Admin"
 * link only to admins through this mechanism - showing it to every
 * signed-in (or every) visitor would leak "an admin section exists" to
 * non-admins, which the route shims themselves are careful to avoid via
 * notFound() (see app/(admin)/admin/**). SiteHeader.tsx is a plain server
 * component with no session read today, so wiring real per-user nav
 * visibility would mean changing that component's shape - out of scope
 * for this feature. v1 tradeoff: admins navigate to /admin directly (or
 * bookmark it); no nav link is rendered for anyone.
 *
 * No providers/cronTasks/jobDetailActions either - just route shims under
 * app/(admin)/admin/** and server actions, gated by authGuard.ts's
 * requireAdmin() (role-based), not checkAccess() (feature-flag-based).
 */
export const adminFeature: FeaturePlugin = {
  key: "admin",
};
