"use client";

import * as React from "react";
import { Listbox as HeadlessListbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ListboxOption {
  value: string;
  label: string;
}

interface ListboxProps {
  options: ListboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  leftIcon?: React.ReactNode;
}

export function Listbox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  leftIcon,
}: ListboxProps) {
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={cn("relative w-full", className)}>
      <HeadlessListbox value={value} onChange={onChange}>
        <div className="relative mt-1">
          <HeadlessListbox.Button className="relative w-full h-11 cursor-default rounded-lg border border-input bg-input-background pl-3 pr-10 text-left text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <div className="flex items-center gap-2">
              {leftIcon && (
                <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
                  {leftIcon}
                </span>
              )}
              <span className={cn("block truncate", !selectedOption && "text-muted-foreground")}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDown
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
          </HeadlessListbox.Button>
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <HeadlessListbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-card py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <HeadlessListbox.Option
                  key={option.value}
                  className={({ active }) =>
                    cn(
                      "relative cursor-default select-none py-2 pl-10 pr-4 transition-colors",
                      active ? "bg-muted text-foreground" : "text-foreground"
                    )
                  }
                  value={option.value}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          selected ? "font-semibold" : "font-normal"
                        )}
                      >
                        {option.label}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </HeadlessListbox.Option>
              ))}
            </HeadlessListbox.Options>
          </Transition>
        </div>
      </HeadlessListbox>
    </div>
  );
}
