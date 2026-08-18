/**
 * Barrel re-exporting every feature's db schema slice into one schema for
 * drizzle-kit to generate migrations from. No feature folders exist yet,
 * so this currently exports nothing - each feature adds its own line here
 * when its features/<name>/db/schema.ts is built, e.g.:
 *
 *   export * from "@/features/auth/db/schema";
 *   export * from "@/features/job-sync/db/schema";
 */
export {};
