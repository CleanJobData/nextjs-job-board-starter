"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  position?: "top" | "bottom";
  mode?: "hover" | "click";
}

export function Popover({
  trigger,
  children,
  className,
  position = "top",
  mode = "hover",
}: PopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left + rect.width / 2,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
      
      if (mode === "click") {
        const handleClickOutside = (e: MouseEvent) => {
          if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
            setIsOpen(false);
          }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          window.removeEventListener("scroll", updateCoords, true);
          window.removeEventListener("resize", updateCoords);
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    } else {
      setCoords(null);
    }
    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, mode]);

  const getStyles = () => {
    if (!coords) return { opacity: 0 };

    const gap = 8;
    if (position === "top") {
      return {
        top: `${coords.top - gap}px`,
        left: `${coords.left}px`,
        transform: "translate(-50%, -100%)",
      };
    }

    return {
      top: `${coords.top + coords.height + gap}px`,
      left: `${coords.left}px`,
      transform: "translateX(-50%)",
    };
  };

  const handlers = mode === "hover" ? {
    onMouseEnter: () => setIsOpen(true),
    onMouseLeave: () => setIsOpen(false),
  } : {
    onClick: () => setIsOpen(!isOpen),
  };

  return (
    <>
      <div
        className="relative inline-flex"
        ref={triggerRef}
        {...handlers}
      >
        {trigger}
      </div>
      {mounted &&
        isOpen &&
        coords &&
        createPortal(
          <div
            className={cn(
              "fixed z-[9999] rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 ease-out",
              mode === "hover" && "pointer-events-none",
              className
            )}
            style={getStyles()}
          >
            {children}
            <div
              className={cn(
                "absolute border-[6px] pointer-events-none",
                position === "top"
                  ? "top-full left-1/2 -translate-x-1/2 border-t-border border-l-transparent border-r-transparent border-b-transparent"
                  : "bottom-full left-1/2 -translate-x-1/2 border-b-border border-l-transparent border-r-transparent border-t-transparent"
              )}
            />
            <div
              className={cn(
                "absolute border-[5px] pointer-events-none",
                position === "top"
                  ? "top-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-t-card border-l-transparent border-r-transparent border-b-transparent"
                  : "bottom-[calc(100%-1px)] left-1/2 -translate-x-1/2 border-b-card border-l-transparent border-r-transparent border-t-transparent"
              )}
            />
          </div>,
          document.body
        )}
    </>
  );
}
