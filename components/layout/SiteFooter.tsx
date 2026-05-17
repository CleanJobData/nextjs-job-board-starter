import * as React from "react";
import { Typography } from "@/components/ui/Typography";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-border bg-muted/30 py-12 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Typography variant="small" className="text-muted-foreground">
            &copy; {new Date().getFullYear()} Clean Job Data. All rights reserved.
          </Typography>
          <Typography variant="small" className="text-muted-foreground">
            Powered by <a href="https://cleanjobdata.com" className="hover:text-primary underline underline-offset-4">CleanJobData API</a>
          </Typography>
        </div>
        
        <div className="flex items-center gap-6">
          <a href="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">API Docs</a>
          <a href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          <a href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  );
}
