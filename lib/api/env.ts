export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Retrieves and validates the required API environment variables.
 */
export function getApiConfig(): ApiConfig {
  const baseUrl = process.env.CLEANJOBDATA_API_URL;
  const apiKey = process.env.CLEANJOBDATA_API_KEY;

  if (!baseUrl) {
    throw new Error(
      "Missing CLEANJOBDATA_API_URL environment variable. " +
      "Please ensure it is set in your .env.local or deployment platform (e.g., Vercel)."
    );
  }

  if (!apiKey) {
    throw new Error(
      "Missing CLEANJOBDATA_API_KEY environment variable. " +
      "You can obtain an API key from your CleanJobData dashboard."
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
  };
}
