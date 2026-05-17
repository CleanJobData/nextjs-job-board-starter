import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

        <nav className="flex items-center gap-4">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
