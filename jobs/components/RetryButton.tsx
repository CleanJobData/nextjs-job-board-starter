"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { FaArrowsRotate } from "react-icons/fa6";

export function RetryButton() {
  return (
    <Button 
      variant="ghost" 
      size="lg"
      onClick={() => window.location.reload()}
      className="text-primary"
    >
      <FaArrowsRotate className="h-4 w-4 mr-2" />
      Try Again
    </Button>
  );
}
