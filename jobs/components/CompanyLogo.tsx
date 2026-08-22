"use client";

import * as React from "react";
import { FaBuilding, FaBriefcase } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type FallbackIcon = "building" | "briefcase";

interface CompanyLogoProps {
  src?: string | null;
  className?: string;
  imageClassName?: string;
  iconClassName?: string;
  fallbackIcon?: FallbackIcon;
}

export function CompanyLogo({
  src,
  className,
  imageClassName,
  iconClassName,
  fallbackIcon = "building",
}: CompanyLogoProps) {
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [src]);

  const Fallback = fallbackIcon === "briefcase" ? FaBriefcase : FaBuilding;
  const showImage = Boolean(src) && !failed;

  if (!showImage) {
    return (
      <div
        className={cn("flex items-center justify-center bg-muted shrink-0", className)}
        aria-hidden
      >
        <Fallback className={cn("text-muted-foreground", iconClassName)} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center shrink-0 overflow-hidden", className)}>
      <img
        src={src!}
        alt=""
        className={cn("h-full w-full object-contain", imageClassName)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
