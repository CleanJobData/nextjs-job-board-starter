"use client";

import * as React from "react";
import {
  Listbox as HeadlessListbox,
  ListboxButton,
  ListboxOption as HeadlessListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { FaCheck, FaAngleDown, FaXmark } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";

export interface ListboxOption {
  value: string;
  label: string;
}

interface ListboxProps {
  options: ListboxOption[];
  value?: string;
  selectedValues?: string[];
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  leftIcon?: React.ReactNode;
  multiple?: boolean;
}

export function Listbox({
  options,
  value,
  selectedValues,
  onChange,
  placeholder = "Select...",
  className,
  leftIcon,
  multiple = false,
}: ListboxProps) {
  const currentValue = multiple ? selectedValues : value;

  const getLabel = () => {
    if (multiple) {
      if (!selectedValues || selectedValues.length === 0) return placeholder;
      return `${selectedValues.length} selected`;
    }
    const selectedOption = options.find((o) => o.value === value);
    return selectedOption ? selectedOption.label : placeholder;
  };

  const handleRemove = (val: string) => {
    if (multiple && selectedValues) {
      onChange(selectedValues.filter((v) => v !== val));
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <HeadlessListbox
        value={currentValue}
        onChange={onChange}
        multiple={multiple as any}
      >
        <div className="relative mt-1">
          <ListboxButton className="relative w-full h-11 cursor-default rounded-lg border border-input bg-input-background pl-3 pr-10 text-left text-sm shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
            <div className="flex items-center gap-2">
              {leftIcon && (
                <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
                  {leftIcon}
                </span>
              )}
              <span
                className={cn(
                  "block truncate",
                  !currentValue && "text-muted-foreground",
                )}
              >
                {getLabel()}
              </span>
            </div>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FaAngleDown
                className="h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
          <Transition
            as={React.Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute z-50 mt-1 max-h-60 min-h-[50px] w-full overflow-auto rounded-md border border-border bg-card py-1 text-base shadow-lg focus:outline-none sm:text-sm">
              {options.map((option) => {
                const isSelected = multiple
                  ? selectedValues?.includes(option.value)
                  : value === option.value;

                return (
                  <HeadlessListboxOption
                    key={option.value}
                    className={({ active }) =>
                      cn(
                        "relative cursor-default select-none py-2.5 pl-10 pr-4 transition-colors",
                        active ? "bg-muted text-foreground" : "text-foreground",
                      )
                    }
                    value={option.value}
                  >
                    <>
                      <span
                        className={cn(
                          "block truncate",
                          isSelected ? "font-semibold" : "font-normal",
                        )}
                      >
                        {option.label}
                      </span>
                      {isSelected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary">
                          <FaCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  </HeadlessListboxOption>
                );
              })}
            </ListboxOptions>
          </Transition>
        </div>
      </HeadlessListbox>

      {multiple && selectedValues && selectedValues.length > 0 && (
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
