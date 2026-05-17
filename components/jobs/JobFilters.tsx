"use client";

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Combobox, ComboboxOption } from "@/components/ui/Combobox";
import { Listbox, ListboxOption } from "@/components/ui/Listbox";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { GeoSuggest } from "@/components/jobs/GeoSuggest";
import { cn, debounce, formatNumber } from "@/lib/utils";
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

const countryOptions: ComboboxOption[] = countriesData.map((c: any) => ({
  value: c.code,
  label: c.name,
}));

interface FilterContentProps {
  title: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGeoSelect: (result: GeoSuggestResult) => void;
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
  onGeoSelect,
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
    <div className={cn("flex flex-col gap-6", mobile ? "p-4" : "")}>
      {/* Title Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Keywords
        </label>
        <Input
          placeholder="Job title, keywords..."
          value={title}
          onChange={onTitleChange}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      {/* Geo Suggestion */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Location
        </label>
        <GeoSuggest onSelect={onGeoSelect} />
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
          leftIcon={<MapPin className="h-4 w-4" />}
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
          leftIcon={<Briefcase className="h-4 w-4" />}
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
          leftIcon={<DollarSign className="h-4 w-4" />}
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
          leftIcon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* Remote Toggle */}
      <div className="flex items-center justify-between px-1 py-2 rounded-lg border border-transparent hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <MapPin className="h-4 w-4" />
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
          leftIcon={<SlidersHorizontal className="h-4 w-4" />}
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <X className="mr-2 h-4 w-4" />
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

  // Local state for immediate UI feedback
  const [title, setTitle] = React.useState(searchParams.get("title") || "");
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

  // Sync local state with URL parameters when they change (e.g., when chips are removed)
  React.useEffect(() => {
    setTitle(searchParams.get("title") || "");
    setSelectedCountries(searchParams.get("location")?.split(",") || []);
    setIsRemote(searchParams.get("remote") === "true");
    setSeniority(searchParams.get("experience_level")?.split(",") || []);
    setSalary(searchParams.get("salary") || "");
    setMaxAge(searchParams.get("max_age") || "");
    setSortBy(searchParams.get("sort_by") || "published");
  }, [searchParams]);

  // Update URL function
  const updateUrl = React.useCallback(
    (params: Record<string, string | string[] | boolean | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
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
      });

      // Reset cursor when filters change
      newParams.delete("cursor");

      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounced title update
  const debouncedUpdateTitle = React.useMemo(
    () => debounce((val: string) => updateUrl({ title: val }), 500),
    [updateUrl],
  );

  // Debounced salary update
  const debouncedUpdateSalary = React.useMemo(
    () => debounce((val: string) => updateUrl({ salary: val }), 500),
    [updateUrl],
  );

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    debouncedUpdateTitle(val);
  };

  const handleCountryChange = (vals: string[]) => {
    setSelectedCountries(vals);
    updateUrl({ location: vals });
  };

  const handleRemoteChange = (val: boolean) => {
    setIsRemote(val);
    updateUrl({ remote: val });
  };

  const handleSeniorityChange = (vals: string[]) => {
    setSeniority(vals);
    updateUrl({ experience_level: vals });
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setSalary(val);
    debouncedUpdateSalary(val);
  };

  const handleMaxAgeChange = (val: string) => {
    setMaxAge(val);
    updateUrl({ max_age: val });
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    updateUrl({ sort_by: val });
  };

  const handleGeoSelect = (result: GeoSuggestResult) => {
    if (result.kind === "city") {
      updateUrl({ city_id: String(result.city_id) });
    } else if (result.kind === "state") {
      updateUrl({ state_id: String(result.state_id) });
    } else if (result.kind === "country") {
      updateUrl({ country_id: String(result.country_id) });
    }
  };

  const clearAll = () => {
    setTitle("");
    setSelectedCountries([]);
    setIsRemote(false);
    setSeniority([]);
    setSalary("");
    setMaxAge("");
    setSortBy("published");
    router.push(pathname, { scroll: false });
  };

  const hasFilters = !!(
    title ||
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
    onGeoSelect: handleGeoSelect,
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
          <div>
            <h2 className="text-lg font-bold mb-1">Filters</h2>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Refine your search
            </p>
          </div>
          <FilterContent {...filterProps} />
        </div>
      </aside>

      {/* Mobile Trigger */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <Button
          onClick={() => setIsMobileFiltersOpen(true)}
          className="rounded-full shadow-2xl shadow-primary/20 px-6 py-6 h-auto gap-2"
        >
          <SlidersHorizontal className="h-5 w-5" />
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
      >
        <div className="mt-4">
          <FilterContent {...filterProps} mobile />
          <div className="mt-8 p-4 border-t sticky bottom-0 bg-card">
            <Button
              className="w-full py-6"
              onClick={() => setIsMobileFiltersOpen(false)}
            >
              Show Results
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
