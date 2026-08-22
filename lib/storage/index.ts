import type { StorageAdapter } from "./types";
import { localStorageAdapter } from "./local";
import { createS3StorageAdapter } from "./s3";

export type { StorageAdapter, UploadInput, UploadResult } from "./types";
export { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from "./types";

/**
 * Picks the storage adapter from env vars, NOT features.config.ts - every
 * other cross-cutting toggle in this repo lives in that checked-in config
 * file, but storage credentials (S3 keys, endpoint) are secrets and must
 * never sit in a file that gets committed to git. STORAGE_PROVIDER itself
 * is not secret, but it travels with its provider-specific env vars, so it
 * lives alongside them here rather than being split across two places.
 */
function createStorageAdapter(): StorageAdapter {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "s3") {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "STORAGE_PROVIDER=s3 requires S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY to be set - see lib/storage/README.md."
      );
    }

    return createS3StorageAdapter({
      bucket,
      region,
      accessKeyId,
      secretAccessKey,
      endpoint: process.env.S3_ENDPOINT || undefined,
      publicUrlBase: process.env.S3_PUBLIC_URL_BASE || undefined,
    });
  }

  return localStorageAdapter;
}

let cached: StorageAdapter | null = null;

/** Lazily constructed singleton - avoids building an S3Client (or touching the filesystem) at import time for code paths that never actually upload anything. */
export function getStorageAdapter(): StorageAdapter {
  if (!cached) cached = createStorageAdapter();
  return cached;
}
