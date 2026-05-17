"use server";

import { suggestGeo } from "@/lib/api/geo";
import { GeoSuggestResult } from "@/lib/api/types";

/**
 * Server action to fetch geographic suggestions.
 */
export async function getGeoSuggestions(query: string): Promise<GeoSuggestResult[]> {
  try {
    return await suggestGeo(query);
  } catch (error) {
    console.error("[Geo Suggest Action Error]", error);
    return [];
  }
}
