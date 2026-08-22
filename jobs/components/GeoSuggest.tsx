"use client";

import * as React from "react";
import { FaLocationDot, FaXmark } from "react-icons/fa6";
import { cn, debounce } from "@/lib/utils";
import { GeoSuggestResult } from "@/lib/api/types";
import { getGeoSuggestions } from "@/app/actions/geo";
import {
  ComboboxRoot,
  ComboboxInput,
  ComboboxOptions,
  ComboboxOption,
} from "@/components/ui/Combobox";
import { Badge } from "@/components/ui/Badge";

interface GeoSuggestProps {
  selectedLocations: GeoSuggestResult[];
  onChange: (locations: GeoSuggestResult[]) => void;
  placeholder?: string;
  className?: string;
}

export function GeoSuggest({
  selectedLocations,
  onChange,
  placeholder = "Search location...",
  className,
}: GeoSuggestProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<GeoSuggestResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchSuggestions = React.useMemo(
    () =>
      debounce(async (q: string) => {
        if (q.length < 2) {
          setResults([]);
          return;
        }
        setIsLoading(true);
        try {
          const suggestions = await getGeoSuggestions(q);
          setResults(suggestions);
        } catch (error) {
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }, 300),
    [],
  );

  React.useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const handleRemove = (location: GeoSuggestResult) => {
    onChange(
      selectedLocations.filter(
        (l) =>
          !(
            l.kind === location.kind &&
            l.display_label === location.display_label
          ),
      ),
    );
  };

  return (
    <div className={cn("w-full", className)}>
      <ComboboxRoot
        value={selectedLocations}
        onChange={(vals: GeoSuggestResult[] | null) => vals && onChange(vals)}
        multiple={true as any}
        onClose={() => setQuery("")}
      >
        <div className="relative">
          <ComboboxInput
            leftIcon={<FaLocationDot className="mr-2 h-4 w-4 text-muted-foreground" />}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setQuery(event.target.value)
            }
            displayValue={() => query}
            placeholder={
              selectedLocations.length > 0
                ? `${selectedLocations.length} selected`
                : placeholder
            }
          />
          <ComboboxOptions isLoading={isLoading}>
            {results.length === 0 && query !== "" && !isLoading ? (
              <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                No locations found.
              </div>
            ) : (
              results.map((result) => (
                <ComboboxOption
                  key={`${result.kind}-${result.display_label}`}
                  value={result}
                >
                  {result.display_label}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </ComboboxRoot>

      {selectedLocations.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedLocations.map((loc) => (
            <Badge
              key={`${loc.kind}-${loc.display_label}`}
              variant="accent"
              className="gap-1 pr-1 text-[10px] h-6 uppercase tracking-wider"
            >
              {loc.display_label}
              <button
                type="button"
                onClick={() => handleRemove(loc)}
                className="hover:text-accent-foreground/80 transition-colors"
              >
                <FaXmark className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
