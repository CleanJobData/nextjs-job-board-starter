import { readFile, stat } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

/**
 * Streams back files written by lib/storage/local.ts's adapter. Only
 * exists because that adapter deliberately does NOT write into `public/`
 * (see its doc comment) - this route is the substitute static-file server,
 * with an explicit content-type instead of whatever `public/`'s serving
 * layer would've inferred.
 *
 * Only relevant when STORAGE_PROVIDER=local (or unset, the default) - the
 * s3 adapter returns its own URLs (public bucket URL or a presigned URL)
 * that never touch this route.
 */
const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

// Matches ALLOWED_UPLOAD_MIME_TYPES in lib/storage/types.ts - if that list
// grows, add the matching extension here too.
const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Reject any segment that could climb out of UPLOADS_ROOT before ever
  // touching the filesystem (".." specifically - segments never contain
  // "/" since Next already split them).
  if (segments.some((seg) => seg === "..")) {
    return new Response("Not Found", { status: 404 });
  }

  const relativePath = path.join(...segments);
  const filePath = path.join(UPLOADS_ROOT, relativePath);

  if (!filePath.startsWith(UPLOADS_ROOT + path.sep)) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response("Not Found", { status: 404 });

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Uploaded keys are random (nanoid), so a given URL's content never
        // changes - safe to cache aggressively.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
