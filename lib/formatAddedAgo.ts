/**
 * Formats an ISO date string into a relative "time ago" string.
 * e.g., "added 2hr ago", "added 3 days ago"
 */
export function formatAddedAgo(iso: string, nowMs = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "added recently";

  const diffMs = Math.max(0, nowMs - t);
  const mins = Math.floor(diffMs / 60_000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (days >= 1) {
    return days === 1 ? "added 1 day ago" : `added ${days} days ago`;
  }
  if (hrs >= 1) {
    return hrs === 1 ? "added 1hr ago" : `added ${hrs}hr ago`;
  }
  if (mins >= 1) {
    return mins === 1 ? "added 1m ago" : `added ${mins}m ago`;
  }
  return "added just now";
}
