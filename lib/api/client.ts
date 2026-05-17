import { getApiConfig } from "./env";
import { ApiErrorBody } from "./types";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.code;
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
    let errorBody: ApiErrorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = {
        status: response.status,
        message: response.statusText || `Request failed with status ${response.status}`,
      };
    }
    throw new ApiError(errorBody);
  }

  return response.json() as Promise<T>;
}
