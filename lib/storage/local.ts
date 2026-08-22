import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import type { StorageAdapter, UploadInput, UploadResult } from "./types";
import { assertValidUpload } from "./types";

/**
 * Default storage adapter - writes to a gitignored `uploads/` directory at
 * the repo root (NOT `public/`: serving arbitrary user-uploaded files
 * straight out of `public/` means Next's static file server/CDN caching
 * applies to them with no auth or content-type control, and a bad upload
 * lands directly in the same tree as the app's own static assets). Files
 * are served back out through app/api/uploads/[...path]/route.ts instead,
 * which streams them with an explicit content-type.
 *
 * ONLY suitable for self-hosted deployments with a persistent disk. On a
 * serverless platform (Vercel, etc.) the filesystem a function writes to
 * does not survive past that invocation - and often isn't even shared
 * across concurrently-running instances - so an upload here would appear
 * to succeed and then 404 on the very next request. Set
 * STORAGE_PROVIDER=s3 for any serverless deployment; this file's README
 * covers both.
 */
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

function safeExt(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  // Strip anything that isn't a plain alnum extension - filename comes from
  // the uploader, so don't let it inject path segments via a crafted "extension".
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : "";
}

class LocalStorageAdapter implements StorageAdapter {
  async upload(input: UploadInput): Promise<UploadResult> {
    assertValidUpload(input);

    // Scope is folded into the key itself (not just the directory) so
    // delete()/the route handler only ever need one string, same as the
    // S3 adapter's object key.
    const dir = path.join(UPLOADS_ROOT, input.scope);
    await mkdir(dir, { recursive: true });

    const key = path.posix.join(input.scope, `${nanoid(16)}${safeExt(input.filename)}`);
    const finalPath = path.join(dir, path.basename(key));

    await writeFile(finalPath, input.buffer);

    return { key, url: `/api/uploads/${key}` };
  }

  async delete(key: string): Promise<void> {
    // Guard against a key escaping UPLOADS_ROOT (e.g. "../../etc/passwd") -
    // resolve and confirm the result is still inside the uploads root.
    const resolved = path.join(UPLOADS_ROOT, key);
    if (!resolved.startsWith(UPLOADS_ROOT + path.sep)) {
      throw new Error("Invalid storage key.");
    }
    await unlink(resolved).catch((err) => {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    });
  }
}

export const localStorageAdapter: StorageAdapter = new LocalStorageAdapter();
