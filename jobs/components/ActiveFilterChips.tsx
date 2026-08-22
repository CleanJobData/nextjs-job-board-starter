"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FaXmark } from "react-icons/fa6";
import { Badge } from "@/components/ui/Badge";
import { FilterApplied } from "@/lib/api/types";

interface ActiveFilterChipsProps {
  filtersApplied: FilterApplied[];
}

export function ActiveFilterChips({ filtersApplied }: ActiveFilterChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const removeFilter = (filter: FilterApplied) => {
    const newParams = new URLSearchParams(searchParams.toString());

    const key = filter.key;
    let valueToRemove: string | undefined;

    if (key === "city_id") valueToRemove = String(filter.city_id);
    else if (key === "state_id") valueToRemove = String(filter.state_id);
    else if (key === "country_id") valueToRemove = String(filter.country_id);
    else if (key === "salary")
      valueToRemove = searchParams.get("salary") || undefined;
    else if (key === "remote_only") {
      newParams.delete("remote");
    } else if (key === "max_age") {
      newParams.delete("max_age");
    } else {
      valueToRemove = (filter as any).value;
    }

    if (valueToRemove) {
      // For multi-value filters like location (country codes) or experience_level
      const paramKey =
        key === "location"
          ? "location"
          : key === "experience_level"
            ? "experience_level"
            : key;
      const currentValues = newParams.get(paramKey)?.split(",") || [];
      const updatedValues = currentValues.filter(
        (v) => v !== String(valueToRemove),
      );

      if (updatedValues.length > 0) {
        newParams.set(paramKey, updatedValues.join(","));
      } else {
        newParams.delete(paramKey);
      }
    }

    newParams.delete("cursor");
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  };

  if (!filtersApplied || filtersApplied.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filtersApplied.map((filter, index) => (
        <Badge
          key={`${filter.key}-${index}`}
          variant="secondary"
          className="pl-3 pr-1 py-1 gap-1 h-auto text-xs font-medium border-border/50 bg-muted/50 hover:bg-muted transition-colors"
        >
          {filter.display_label}
          <button
            onClick={() => removeFilter(filter)}
            className="p-0.5 hover:bg-foreground/10 rounded-full transition-colors"
            aria-label={`Remove ${filter.display_label} filter`}
          >
            <FaXmark className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <button
        onClick={() => router.push(pathname, { scroll: false })}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 px-2"
      >
        Clear all
      </button>
    </div>
  );
}
