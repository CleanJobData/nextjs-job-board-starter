"use client";

import * as React from "react";
import {
  Dialog as HeadlessDialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { FaXmark } from "react-icons/fa6";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ isOpen, onClose, children, className }: SheetProps) {
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                as={React.Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel
                  className={cn(
                    "pointer-events-auto w-screen max-w-4xl border-l border-border bg-card shadow-2xl",
                    className,
                  )}
                >
                  <div className="flex h-full flex-col overflow-y-auto">
                    <div className="sticky top-0 z-10 flex items-center justify-between bg-card/80 backdrop-blur-md px-6 py-4 border-b border-border/50">
                      <h2 className="text-lg font-bold">Job Details</h2>
                      <button
                        type="button"
                        className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        onClick={onClose}
                      >
                        <FaXmark className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="relative flex-1 px-6 py-8">
                      {children}
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}
