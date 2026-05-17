const DEFAULT_LABEL = "Location not specified";

/**
 * Shortens very long location strings for UI display.
 */
export function clampLocationLabel(
  raw: string | undefined | null,
  maxChars = 50,
): { label: string; full?: string } {
  const s = raw?.trim() ? raw.trim() : DEFAULT_LABEL;
  if (s.length <= maxChars) {
    return { label: s };
  }
  return {
    label: `${s.slice(0, maxChars - 1)}\u2026`,
    full: s,
  };
}
