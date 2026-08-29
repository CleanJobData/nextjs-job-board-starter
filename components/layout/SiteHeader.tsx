import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileNav } from "@/components/layout/MobileNav";
import { activeNavItems } from "@/features/registry";

/**
 * `sm` (640px) is the breakpoint used for the hamburger cutover, matching
 * the only other responsive behavior already in this codebase's header
 * area (MobileNav's own `sm:hidden` on its trigger, and the `--spacing-card`
 * bump in app/globals.css uses the same 640px min-width). Right now there
 * are only 3 possible nav items total (Sign In OR Post a Job/My
 * Applications, depending on auth state, plus admin having none) so the
 * desktop row isn't crowded *today*, but this is a real, if not yet acute,
 * overflow risk as more features register nav items - fixing it now avoids
 * a wrap-around layout bug appearing later with no warning.
 *
 * SiteHeader stays a server component: activeNavItems is resolved here,
 * server-side, and handed to MobileNav (a client component) as a plain
 * prop/children, never imported by it directly - see MobileNav.tsx's doc
 * comment for why that specific import is a previously-fixed build breaker.
 */
export function SiteHeader() {
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
          {activeNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-2 sm:hidden">
          <MobileNav navItems={activeNavItems}>
            <ThemeToggle />
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
