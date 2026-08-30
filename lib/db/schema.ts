/**
 * Barrel re-exporting every feature's db schema slice into one schema for
 * drizzle-kit to generate migrations from. Each feature adds its own line
 * here when its features/<name>/db/schema.ts is built.
 */
export * from "@/features/auth/db/schema";
export * from "@/features/job-sync/db/schema";
export * from "@/features/applications/db/schema";
export * from "@/features/job-alerts/db/schema";
export * from "@/features/resume/db/schema";
