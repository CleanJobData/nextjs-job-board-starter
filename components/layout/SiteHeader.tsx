import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/Button";
import { activeNavItems } from "@/features/registry";
import { auth, signOut } from "@/features/auth/lib/auth";
import featuresConfig from "@/features.config";

/**
 * `sm` (640px) is the breakpoint used for the hamburger cutover, matching
 * the only other responsive behavior already in this codebase's header
 * area (MobileNav's own `sm:hidden` on its trigger, and the `--spacing-card`
 * bump in app/globals.css uses the same 640px min-width).
 *
 * SiteHeader stays a server component: activeNavItems, the session, and
 * the derived auth-state nav items are all resolved here, server-side, and
 * handed to MobileNav (a client component) as plain props/children, never
 * imported by it directly - see MobileNav.tsx's doc comment for why that
 * specific import is a previously-fixed build breaker.
 *
 * "Sign In" used to be a static navItems() entry on the auth feature -
 * moved here because it must disappear once a session exists (and a
 * sign-out control must appear instead), which a statically-composed,
 * module-eval-time nav list (features/registry.ts's activeNavItems) has
 * no way to express - it's built once with zero access to per-request
 * session state. Same reasoning for the "Admin" link: it only makes sense
 * to show for an actual admin session, which is exactly the kind of
 * per-request state the static composition can't see.
 */
export async function SiteHeader() {
  const session = featuresConfig.auth.enabled ? await auth() : null;
  const isAdmin = featuresConfig.admin.enabled && session?.user?.role === "admin";

  const authNavItems = session
    ? [
        ...(isAdmin ? [{ label: "Admin", href: "/admin" }] : []),
      ]
    : featuresConfig.auth.enabled
      ? [{ label: "Sign In", href: "/sign-in" }]
      : [];

  // "Browse Jobs" is a fixed, always-present core link (not routed through
  // features/registry.ts's navItems() composition) - job browsing itself
  // isn't an optional feature, it's core, so it doesn't belong in the same
  // list as feature-registered items. This became necessary once the
  // logo/home link started pointing at a separate marketing landing page
  // instead of the job search results - before that, "/" already was the
  // browse page, so no explicit nav entry was needed.
  const navItems = [{ label: "Browse Jobs", href: "/jobs" }, ...activeNavItems, ...authNavItems];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="JobBoard Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold tracking-tight text-foreground">
            JobBoard
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {session && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button type="submit" variant="ghost" size="sm">
                Sign Out
              </Button>
            </form>
          )}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <MobileNav navItems={navItems}>
            {session && (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
                  Sign Out
                </Button>
              </form>
            )}
            <ThemeToggle />
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
