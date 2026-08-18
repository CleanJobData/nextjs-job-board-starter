import type { FeaturePlugin } from "../registry";
import { AuthSessionProvider } from "./components/AuthSessionProvider";

export const authFeature: FeaturePlugin = {
  key: "auth",
  navItems: () => [{ label: "Sign In", href: "/sign-in" }],
  providers: [AuthSessionProvider],
};
