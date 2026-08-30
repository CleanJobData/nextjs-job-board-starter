"use client";

import * as React from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { FaXmark } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  children,
  className,
}: DialogProps) {
  return (
    <Transition show={isOpen} as={React.Fragment}>
      <HeadlessDialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-overlay backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4 text-center">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={cn(
                  "w-full max-w-md transform overflow-hidden rounded-t-2xl sm:rounded-lg bg-card p-card text-left align-middle shadow-lg transition-all border border-border",
                  className,
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  {title && (
                    <DialogTitle
                      as="h3"
                      className="text-lg font-bold leading-6 text-foreground"
                    >
                      {title}
                    </DialogTitle>
                  )}
                  {/* ml-auto, not justify-between on the parent: with no
                      `title` the close button was the row's only child, so
                      justify-between left it sitting at the start (visually
                      the top-LEFT of the dialog) instead of the top-right
                      where a close affordance belongs. ml-auto pins it right
                      whether or not a title is present. */}
                  <button
                    type="button"
                    aria-label="Close"
                    className="ml-auto shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    onClick={onClose}
                  >
                    <FaXmark className="h-4 w-4" />
                  </button>
                </div>
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
