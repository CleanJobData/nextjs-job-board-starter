import { apiFetch } from "./client";
import { GeoSuggestResult } from "./types";

/**
 * Fetches geographic suggestions for a search query.
 */
export async function suggestGeo(q: string): Promise<GeoSuggestResult[]> {
  if (!q || q.length < 2) return [];

  const params = new URLSearchParams({ q });
  return apiFetch<GeoSuggestResult[]>(`/geo/suggest?${params.toString()}`);
}
