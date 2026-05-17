import * as React from "react";
import Image from "next/image";
import { Typography } from "@/components/ui/Typography";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-muted/30 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="JobBoard Logo"
              width={24}
              height={24}
              className="h-6 w-6 opacity-70 grayscale hover:grayscale-0 transition-all"
            />
            <span className="font-semibold text-muted-foreground">JobBoard</span>
          </div>
          <div className="flex flex-col items-center md:items-start gap-1">
            <Typography variant="small" className="text-muted-foreground">
              &copy; {new Date().getFullYear()} CleanJobData. All rights reserved.
            </Typography>
            <Typography variant="small" className="text-muted-foreground">
              Powered by <a href="https://cleanjobdata.com" className="hover:text-primary underline underline-offset-4">CleanJobData API</a>
            </Typography>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="https://cleanjobdata.com/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">API Docs</a>
          <a href="https://cleanjobdata.com/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          <a href="https://cleanjobdata.com/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
