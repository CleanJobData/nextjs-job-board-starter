import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Simple debounce function.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Formats a number with commas.
 */
export function formatNumber(val: string | number) {
  if (val === undefined || val === null || val === "") return "";
  const num =
    typeof val === "string" ? parseInt(val.replace(/[^0-9]/g, ""), 10) : val;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("en-US").format(num);
}
