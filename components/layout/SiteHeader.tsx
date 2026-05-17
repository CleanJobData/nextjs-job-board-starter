import * as React from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Typography } from "@/components/ui/Typography";

export function SiteHeader() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Clean Job Data";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <Typography variant="h4" className="font-bold tracking-tight">
            {siteName}
          </Typography>
        </Link>

        <nav className="flex items-center gap-4">
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
