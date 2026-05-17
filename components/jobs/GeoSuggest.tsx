"use client";

import * as React from "react";
import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown, Search, MapPin, Loader2 } from "lucide-react";
import { cn, debounce } from "@/lib/utils";
import { GeoSuggestResult } from "@/lib/api/types";
import { getGeoSuggestions } from "@/app/actions/geo";

interface GeoSuggestProps {
  onSelect: (result: GeoSuggestResult) => void;
  placeholder?: string;
  className?: string;
}

export function GeoSuggest({
  onSelect,
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
    []
  );

  React.useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  return (
    <div className={cn("w-full", className)}>
      <HeadlessCombobox onChange={(val: GeoSuggestResult | null) => val && onSelect(val)}>
        <div className="relative">
          <div className="relative w-full h-11 cursor-default overflow-hidden rounded-lg border border-input bg-input-background text-left text-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring/50">
            <div className="flex items-center px-3 h-full">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <HeadlessCombobox.Input
                className="w-full border-none bg-transparent py-2 text-sm leading-5 text-foreground focus:ring-0 placeholder:text-muted-foreground outline-none"
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(result: GeoSuggestResult | null) => result?.display_label || ""}
                placeholder={placeholder}
              />
              <div className="flex items-center gap-1">
                {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                <HeadlessCombobox.Button className="flex items-center">
                  <ChevronsUpDown
                    className="h-4 w-4 text-muted-foreground opacity-50"
                    aria-hidden="true"
                  />
                </HeadlessCombobox.Button>
              </div>
            </div>
          </div>
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <HeadlessCombobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {results.length === 0 && query !== "" && !isLoading ? (
                <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                  No locations found.
                </div>
              ) : (
                results.map((result) => (
                  <HeadlessCombobox.Option
                    key={`${result.kind}-${result.display_label}`}
                    className={({ active }) =>
                      cn(
                        "relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors",
                        active ? "bg-muted text-foreground" : "text-foreground"
                      )
                    }
                    value={result}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={cn(
                            "block truncate",
                            selected ? "font-semibold" : "font-normal"
                          )}
                        >
                          {result.display_label}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </HeadlessCombobox.Option>
                ))
              )}
            </HeadlessCombobox.Options>
          </Transition>
        </div>
      </HeadlessCombobox>
    </div>
  );
}
