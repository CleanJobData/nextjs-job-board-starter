import { getApiConfig } from "./env";
import { ApiErrorBody } from "./types";

export class ApiError extends Error {
  status: number;
  code?: string;
  url?: string;

  constructor(body: ApiErrorBody, url?: string) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.code;
    this.url = url;
  }
}

/**
 * Server-side fetch wrapper for the CleanJobData API.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { baseUrl, apiKey } = getApiConfig();
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorBody: any;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {};
    }

    // Ensure we always have a status and a message
    const finalError: ApiErrorBody = {
      status: errorBody.status || response.status,
      message: errorBody.message || errorBody.error || response.statusText || "Unknown API Error",
      code: errorBody.code,
    };

    throw new ApiError(finalError, url);
  }

  return response.json() as Promise<T>;
}
