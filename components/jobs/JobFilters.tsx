"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FaMagnifyingGlass,
  FaLocationDot,
  FaBriefcase,
  FaDollarSign,
  FaClock,
  FaSliders,
  FaXmark,
} from "react-icons/fa6";
import { Input } from "@/components/ui/Input";
import { Combobox, ComboboxOptionType } from "@/components/ui/Combobox";
import { Listbox, ListboxOption } from "@/components/ui/Listbox";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { GeoSuggest } from "@/components/jobs/GeoSuggest";
import { cn, formatNumber } from "@/lib/utils";
import countriesData from "@/data/countries.json";
import { GeoSuggestResult } from "@/lib/api/types";

// Options for Seniority
const seniorityOptions: ListboxOption[] = [
  { value: "EN", label: "Entry Level" },
  { value: "MI", label: "Mid Level" },
  { value: "SE", label: "Senior Level" },
  { value: "EX", label: "Executive" },
];

// Options for Max Age
const maxAgeOptions: ListboxOption[] = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

// Options for Sort By
const sortOptions: ListboxOption[] = [
  { value: "published", label: "Most Recent" },
  { value: "relevance", label: "Relevance" },
];

const countryOptions: ComboboxOptionType[] = countriesData.map((c: any) => ({
  value: c.code,
  label: c.name,
}));

interface FilterContentProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedLocations: GeoSuggestResult[];
  onGeoChange: (locations: GeoSuggestResult[]) => void;
  selectedCountries: string[];
  onCountryChange: (vals: string[]) => void;
  seniority: string[];
  onSeniorityChange: (vals: string[]) => void;
  salary: string;
  onSalaryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  maxAge: string;
  onMaxAgeChange: (val: string) => void;
  isRemote: boolean;
  onRemoteChange: (val: boolean) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  hasFilters: boolean;
  onClearAll: () => void;
  mobile?: boolean;
}

function FilterContent({
  title,
  onTitleChange,
  selectedLocations,
  onGeoChange,
  selectedCountries,
  onCountryChange,
  seniority,
  onSeniorityChange,
  salary,
  onSalaryChange,
  maxAge,
  onMaxAgeChange,
  isRemote,
  onRemoteChange,
  sortBy,
  onSortChange,
  hasFilters,
  onClearAll,
  mobile = false,
}: FilterContentProps) {
  return (
    <div className={cn("flex flex-col gap-6")}>
      {/* Title Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Keywords
        </label>
        <Input
          placeholder="Job title, keywords..."
          value={title}
          onChange={onTitleChange}
          leftIcon={<FaMagnifyingGlass className="h-4 w-4" />}
        />
      </div>

      {/* Geo Suggestion */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Location
        </label>
        <GeoSuggest selectedLocations={selectedLocations} onChange={onGeoChange} />
      </div>

      {/* Country Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Countries
        </label>
        <Combobox
          options={countryOptions}
          selectedValues={selectedCountries}
          onChange={onCountryChange}
          placeholder="Select countries..."
          leftIcon={<FaLocationDot className="h-4 w-4" />}
        />
      </div>

      {/* Seniority Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Seniority
        </label>
        <Listbox
          options={seniorityOptions}
          selectedValues={seniority}
          onChange={onSeniorityChange}
          placeholder="All Levels"
          multiple
          leftIcon={<FaBriefcase className="h-4 w-4" />}
        />
      </div>

      {/* Salary Input */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Min Salary ($)
        </label>
        <Input
          placeholder="e.g. 80,000"
          value={formatNumber(salary)}
          onChange={onSalaryChange}
          leftIcon={<FaDollarSign className="h-4 w-4" />}
        />
      </div>

      {/* Max Age Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Freshness
        </label>
        <Listbox
          options={maxAgeOptions}
          value={maxAge}
          onChange={onMaxAgeChange}
          placeholder="Anytime"
          leftIcon={<FaClock className="h-4 w-4" />}
        />
      </div>

      {/* Remote Toggle */}
      <div
        className="flex items-center justify-between px-1 py-2 rounded-lg border border-transparent hover:bg-muted/30 transition-colors cursor-pointer"
        onClick={() => onRemoteChange(!isRemote)}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <FaLocationDot className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Remote Only</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
              Work from anywhere
            </p>
          </div>
        </div>
        <Switch checked={isRemote} onChange={onRemoteChange} />
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Sort By
        </label>
        <Listbox
          options={sortOptions}
          value={sortBy}
          onChange={onSortChange}
          leftIcon={<FaSliders className="h-4 w-4" />}
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <FaXmark className="mr-2 h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = React.useState(false);

  // Local state for "draft" filters
  const [title, setTitle] = React.useState(searchParams.get("title") || "");
  const [selectedLocations, setSelectedLocations] = React.useState<
    GeoSuggestResult[]
  >([]);
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>(
    searchParams.get("location")?.split(",") || [],
  );
  const [isRemote, setIsRemote] = React.useState(
    searchParams.get("remote") === "true",
  );
  const [seniority, setSeniority] = React.useState<string[]>(
    searchParams.get("experience_level")?.split(",") || [],
  );
  const [salary, setSalary] = React.useState(searchParams.get("salary") || "");
  const [maxAge, setMaxAge] = React.useState(searchParams.get("max_age") || "");
  const [sortBy, setSortBy] = React.useState(
    searchParams.get("sort_by") || "published",
  );

  // Sync local state with URL parameters ONLY when searchParams change externally (e.g. from chips)
  // We use a ref to track if the last update was local to avoid the "overwrite" issue
  const lastUpdateWasLocal = React.useRef(false);

  React.useEffect(() => {
    if (lastUpdateWasLocal.current) {
      lastUpdateWasLocal.current = false;
      return;
    }

    setTitle(searchParams.get("title") || "");
    setSelectedCountries(searchParams.get("location")?.split(",") || []);
    setIsRemote(searchParams.get("remote") === "true");
    setSeniority(searchParams.get("experience_level")?.split(",") || []);
    setSalary(searchParams.get("salary") || "");
    setMaxAge(searchParams.get("max_age") || "");
    setSortBy(searchParams.get("sort_by") || "published");

    const cityIds = searchParams.get("city_id")?.split(",") || [];
    const stateIds = searchParams.get("state_id")?.split(",") || [];
    const countryIds = searchParams.get("country_id")?.split(",") || [];

    setSelectedLocations((prev) =>
      prev.filter((loc) => {
        if (loc.kind === "city") return cityIds.includes(String(loc.city_id));
        if (loc.kind === "state") return stateIds.includes(String(loc.state_id));
        if (loc.kind === "country")
          return countryIds.includes(String(loc.country_id));
        return false;
      }),
    );
  }, [searchParams]);

  // Apply filters to URL
  const applyFilters = React.useCallback(() => {
    lastUpdateWasLocal.current = true;
    const newParams = new URLSearchParams();

    // Helper to set params
    const set = (key: string, value: string | string[] | boolean | undefined) => {
      if (
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0) ||
        value === false
      ) {
        newParams.delete(key);
      } else if (Array.isArray(value)) {
        newParams.set(key, value.join(","));
      } else {
        newParams.set(key, String(value));
      }
    };

    set("title", title);
    set("location", selectedCountries);
    set("remote", isRemote);
    set("experience_level", seniority);
    set("salary", salary);
    set("max_age", maxAge);
    set("sort_by", sortBy);

    const cityIds = selectedLocations
      .filter((l) => l.kind === "city")
      .map((l) => String(l.city_id));
    const stateIds = selectedLocations
      .filter((l) => l.kind === "state")
      .map((l) => String(l.state_id));
    const countryIds = selectedLocations
      .filter((l) => l.kind === "country")
      .map((l) => String(l.country_id));

    set("city_id", cityIds);
    set("state_id", stateIds);
    set("country_id", countryIds);

    // Reset cursor when filters change
    newParams.delete("cursor");

    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    setIsMobileFiltersOpen(false);
  }, [
    router,
    pathname,
    title,
    selectedCountries,
    isRemote,
    seniority,
    salary,
    maxAge,
    sortBy,
    selectedLocations,
  ]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleCountryChange = (vals: string[]) => {
    setSelectedCountries(vals);
  };

  const handleRemoteChange = (val: boolean) => {
    setIsRemote(val);
  };

  const handleSeniorityChange = (vals: string[]) => {
    setSeniority(vals);
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setSalary(val);
  };

  const handleMaxAgeChange = (val: string) => {
    setMaxAge(val);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
  };

  const handleGeoChange = (locations: GeoSuggestResult[]) => {
    setSelectedLocations(locations);
  };

  const clearAll = () => {
    setTitle("");
    setSelectedLocations([]);
    setSelectedCountries([]);
    setIsRemote(false);
    setSeniority([]);
    setSalary("");
    setMaxAge("");
    setSortBy("published");
    lastUpdateWasLocal.current = true;
    router.push(pathname, { scroll: false });
  };

  const hasFilters = !!(
    title ||
    selectedLocations.length > 0 ||
    selectedCountries.length > 0 ||
    isRemote ||
    seniority.length > 0 ||
    salary ||
    maxAge ||
    sortBy !== "published"
  );

  const filterProps = {
    title,
    onTitleChange: handleTitleChange,
    selectedLocations,
    onGeoChange: handleGeoChange,
    selectedCountries,
    onCountryChange: handleCountryChange,
    seniority,
    onSeniorityChange: handleSeniorityChange,
    salary,
    onSalaryChange: handleSalaryChange,
    maxAge,
    onMaxAgeChange: handleMaxAgeChange,
    isRemote,
    onRemoteChange: handleRemoteChange,
    sortBy,
    onSortChange: handleSortChange,
    hasFilters,
    onClearAll: clearAll,
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 shrink-0">
        <div className="sticky top-24 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold mb-1">Filters</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                Refine your search
              </p>
            </div>
          </div>
          <FilterContent {...filterProps} />
          <div className="pt-4 border-t">
            <Button className="w-full py-6" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Trigger */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="rounded-full shadow-2xl shadow-primary/20 px-6 py-2 h-auto gap-2"
        >
          <FaSliders className="h-5 w-5" />
          Filters
          {hasFilters && (
            <Badge
              variant="accent"
              className="ml-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-white text-primary"
            >
              !
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile Drawer */}
      <Dialog
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        title="Filters"
        className="max-h-[92vh] flex flex-col"
      >
        <div className="flex-1 overflow-y-auto px-1 py-4">
          <FilterContent {...filterProps} mobile />
        </div>
        <div className="mt-auto p-4 border-t bg-card">
          <Button className="w-full py-6" onClick={applyFilters}>
            Show Results
          </Button>
        </div>
      </Dialog>
    </>
  );
}
