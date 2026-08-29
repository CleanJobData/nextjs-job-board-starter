"use client";

import * as React from "react";
import Link from "next/link";
import { FaBars } from "react-icons/fa6";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { NavItem } from "@/features/registry";

interface MobileNavProps {
  /**
   * Resolved server-side by SiteHeader and passed down as a plain prop -
   * this file must never import features/registry.ts directly. That
   * registry transitively pulls in job-sync's `pg` (a Node-only driver),
   * which previously broke the build when a client component imported it;
   * the fix that established this prop-drilling pattern is jobDetailActions
   * flowing into jobs/components/JobSideView.tsx the same way.
   */
  navItems: NavItem[];
  /** Anything else the header shows alongside nav links (theme toggle, auth state) - rendered again inside the drawer so mobile users get full parity with desktop, not a stripped-down menu. */
  children?: React.ReactNode;
}

/**
 * Client-only island for the hamburger + slide-out drawer. Split out of
 * SiteHeader (a server component) instead of making the whole header a
 * client component, mirroring JobSideView/JobDetailView's split for the
 * same reason: keep server-only imports (here, features/registry.ts) out
 * of anything that ends up in a client bundle.
 */
export function MobileNav({ navItems, children }: MobileNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        className="sm:hidden"
        onClick={() => setIsOpen(true)}
      >
        <FaBars className="h-5 w-5" />
      </Button>

      <Sheet isOpen={isOpen} onClose={() => setIsOpen(false)} title="Menu" className="max-w-xs">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {children != null && (
          <div className="mt-6 border-t border-border pt-6">{children}</div>
        )}
      </Sheet>
    </>
  );
}
