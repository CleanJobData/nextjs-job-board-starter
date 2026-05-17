"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCcw } from "lucide-react";

export function RetryButton() {
  return (
    <Button 
      variant="ghost" 
      size="lg"
      onClick={() => window.location.reload()}
      className="text-primary"
    >
      <RefreshCcw className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  );
}
