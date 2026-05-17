"use client";

import * as React from "react";
import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  closeOnSelect?: boolean;
}

export function Combobox({
  options,
  selectedValues,
  onChange,
  placeholder = "Search...",
  className,
  leftIcon,
  closeOnSelect = false,
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
              .includes(query.toLowerCase().replace(/\s+/g, ""))
          )
          .slice(0, 50);

  const handleRemove = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value));
  };

  return (
    <div className={cn("w-full", className)}>
      <HeadlessCombobox
        value={selectedValues}
        onChange={onChange}
        multiple
        onClose={() => setQuery("")}
      >
        {({ open }) => (
          <div className="relative">
            <div className="relative w-full h-11 cursor-default overflow-hidden rounded-lg border border-input bg-input-background text-left text-sm shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring/50">
              <div className="flex items-center px-3 h-full">
                {leftIcon ? (
                  <span className="mr-2 text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
                    {leftIcon}
                  </span>
                ) : (
                  <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                )}
                <HeadlessCombobox.Input
                  className="w-full border-none bg-transparent py-2 text-sm leading-5 text-foreground focus:ring-0 placeholder:text-muted-foreground outline-none"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}
                />
                <HeadlessCombobox.Button className="flex items-center">
                  <ChevronsUpDown
                    className="h-4 w-4 text-muted-foreground opacity-50"
                    aria-hidden="true"
                  />
                </HeadlessCombobox.Button>
              </div>
            </div>
            <Transition
              show={open}
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <HeadlessCombobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredOptions.length === 0 && query !== "" ? (
                  <div className="relative cursor-default select-none px-4 py-2 text-muted-foreground">
                    Nothing found.
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <HeadlessCombobox.Option
                        key={option.value}
                        className={({ active }) =>
                          cn(
                            "relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors",
                            active ? "bg-muted text-foreground" : "text-foreground"
                          )
                        }
                        value={option.value}
                      >
                        <>
                          <span
                            className={cn(
                              "block truncate",
                              isSelected ? "font-semibold" : "font-normal"
                            )}
                          >
                            {option.label}
                          </span>
                          {isSelected ? (
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                              <Check className="h-4 w-4" aria-hidden="true" />
                            </span>
                          ) : null}
                        </>
                      </HeadlessCombobox.Option>
                    );
                  })
                )}
              </HeadlessCombobox.Options>
            </Transition>
          </div>
        )}
      </HeadlessCombobox>

      {selectedValues.length > 0 && (
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
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
