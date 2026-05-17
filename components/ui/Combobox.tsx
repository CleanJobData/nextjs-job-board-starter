"use client";

import * as React from "react";
import {
  Combobox as HeadlessCombobox,
  ComboboxButton as HeadlessComboboxButton,
  ComboboxInput as HeadlessComboboxInput,
  ComboboxOption as HeadlessComboboxOption,
  ComboboxOptions as HeadlessComboboxOptions,
  Transition,
} from "@headlessui/react";
import { FaCheck, FaArrowsUpDown, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

/**
 * Base styled components for building custom Comboboxes
 */

export const ComboboxRoot = HeadlessCombobox;

export function ComboboxInput({
  className,
  leftIcon,
  placeholder,
  ...props
}: any) {
  return (
    <div className="relative w-full h-11 cursor-default overflow-hidden rounded-lg border border-input bg-input-background text-left text-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring/50">
      <div className="flex items-center px-3 h-full">
        {leftIcon ? (
          <span className="mr-2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
            {leftIcon}
          </span>
        ) : (
          <FaMagnifyingGlass className="mr-2 h-4 w-4 text-muted-foreground" />
        )}
        <HeadlessComboboxInput
          className={cn(
            "w-full border-none bg-transparent py-2 text-sm leading-5 text-foreground focus:ring-0 placeholder:text-muted-foreground outline-none",
            className,
          )}
          placeholder={placeholder}
          {...props}
        />
        <HeadlessComboboxButton className="flex items-center">
          <FaArrowsUpDown
            className="h-4 w-4 text-muted-foreground opacity-80"
            aria-hidden="true"
          />
        </HeadlessComboboxButton>
      </div>
    </div>
  );
}

export function ComboboxOptions({
  className,
  children,
  isLoading,
  ...props
}: any) {
  return (
    <Transition
      as={React.Fragment}
      leave="transition ease-in duration-100"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <HeadlessComboboxOptions
        className={cn(
          "absolute z-50 mt-1 max-h-60 min-h-[50px] w-full overflow-auto rounded-lg border border-border bg-card text-base shadow-xl focus:outline-none sm:text-sm",
          className,
        )}
        {...props}
      >
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-10">
            <div className="h-full bg-primary animate-[loading-bar_1.5s_infinite_linear]" />
          </div>
        )}
        <div className="py-1">{children}</div>
      </HeadlessComboboxOptions>
    </Transition>
  );
}

export function ComboboxOption({
  className,
  children,
  value,
  ...props
}: any) {
  return (
    <HeadlessComboboxOption
      value={value}
      className={({ active }: { active: boolean }) =>
        cn(
          "relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors",
          active ? "bg-muted text-foreground" : "text-foreground",
          className,
        )
      }
      {...props}
    >
      {({ selected }) => (
        <>
          <span
            className={cn(
              "block truncate",
              selected ? "font-semibold" : "font-normal",
            )}
          >
            {children}
          </span>
          {selected ? (
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                        <FaCheck className="h-4 w-4" aria-hidden="true" />
            </span>
          ) : null}
        </>
      )}
    </HeadlessComboboxOption>
  );
}

/**
 * High-level Combobox component for simple use cases
 */

export interface ComboboxOptionType {
  value: string;
  label: string;
}

interface ComboboxProps {
  options?: ComboboxOptionType[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  isLoading?: boolean;
  multiple?: boolean;
}

export function Combobox({
  options = [],
  selectedValues,
  onChange,
  onQueryChange,
  placeholder = "Search...",
  className,
  leftIcon,
  isLoading = false,
  multiple = true,
}: ComboboxProps) {
  const [query, setQuery] = React.useState("");

  const filteredOptions =
    query === ""
      ? options.slice(0, 50)
      : options
          .filter((option) =>
            option.label
              .toLowerCase()
              .replace(/\s+/g, "")
              .includes(query.toLowerCase().replace(/\s+/g, "")),
          )
          .slice(0, 50);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = event.target.value;
    setQuery(newQuery);
    onQueryChange?.(newQuery);
  };

  const handleRemove = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  return (
    <div className={cn("w-full", className)}>
      <ComboboxRoot
        value={selectedValues}
        onChange={(vals: string[] | null) => vals && onChange(vals)}
        multiple={multiple as any}
        onClose={() => setQuery("")}
      >
        <div className="relative">
          <ComboboxInput
            leftIcon={leftIcon}
            onChange={handleQueryChange}
            displayValue={() => query}
            placeholder={
              multiple && selectedValues.length > 0
                ? `${selectedValues.length} selected`
                : placeholder
            }
          />
          <ComboboxOptions isLoading={isLoading}>
            {filteredOptions.length === 0 && query !== "" && !isLoading ? (
              <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <ComboboxOption key={option.value} value={option.value}>
                  {option.label}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </ComboboxRoot>

      {multiple && selectedValues.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectedValues.map((val) => {
            const label = options.find((o) => o.value === val)?.label || val;
            return (
              <Badge
                key={val}
                variant="accent"
                className="gap-1 pr-1 text-[10px] h-6 uppercase tracking-wider"
              >
                {label}
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  className="hover:text-accent-foreground/80 transition-colors"
                >
                  <FaXmark className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
