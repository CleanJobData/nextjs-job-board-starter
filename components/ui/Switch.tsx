"use client";

import { Switch as HeadlessSwitch } from "@headlessui/react";
import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export function Switch({ checked, onChange, label, className }: SwitchProps) {
  return (
    <label
      className={cn(
        "flex items-center justify-between gap-3 cursor-pointer group transition-all",
        label ? "w-full h-11 px-3 rounded-lg border border-input bg-input-background shadow-sm" : "",
        className
      )}
    >
      {label && (
        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
      )}
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-switch-thumb transition duration-200 ease-in-out ml-0.5",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </HeadlessSwitch>
    </label>
  );
}
