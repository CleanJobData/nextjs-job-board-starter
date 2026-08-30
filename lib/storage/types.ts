/**
 * Feature-agnostic file storage adapter contract - deliberately NOT owned
 * by any one feature (job-posting's company logos are the first consumer,
 * but resume uploads and anything else that needs to persist a user-supplied
 * file later reuse this same module instead of each rolling their own).
 *
 * `scope` is a plain namespacing string (e.g. "company-logos", "resumes")
 * so multiple features sharing one bucket/disk don't collide on filenames -
 * each adapter is responsible for folding `scope` into the key it derives,
 * not the caller.
 */
export interface StorageAdapter {
  upload(input: UploadInput): Promise<UploadResult>;
  delete(key: string): Promise<void>;
}

export interface UploadInput {
  buffer: Buffer;
  filename: string;
  contentType: string;
  /** Namespacing bucket-within-the-bucket, e.g. "company-logos" - keeps unrelated features' files from colliding in the same underlying store. */
  scope: string;
  /**
   * What THIS upload accepts. Adapters re-validate defensively, so without
   * this they'd re-check against the image-only default and reject a
   * legitimate PDF even when the caller had already allowed it - which is
   * exactly what happened when resumes were first wired up. Defaults to
   * images, matching every pre-resume consumer.
   */
  allowedMimeTypes?: readonly string[];
}

export interface UploadResult {
  /** Adapter-internal identifier (a relative path for the local adapter, an object key for S3) - pass this back to `delete()`. Not necessarily public. */
  key: string;
  /** A URL the browser can actually load the file from - for local this is always `/api/uploads/...`; for S3 it's either a public bucket URL or a presigned URL depending on config, see s3.ts. */
  url: string;
}

/** 5MB - generous enough for a company logo, small enough to not need multipart/chunked upload handling. Bump per-consumer only once a real need shows up; not worth a caller-supplied override yet. */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

/** Resume uploads. PDF only for now - see features/resume/lib/parse.ts for why DOCX isn't in v1. */
export const DOCUMENT_UPLOAD_MIME_TYPES = ["application/pdf"] as const;

/** Back-compat default: callers that don't say otherwise get images, which is what every pre-resume consumer expected. */
export const ALLOWED_UPLOAD_MIME_TYPES = IMAGE_UPLOAD_MIME_TYPES;

/**
 * The allowed list is per-call rather than one global union: widening the
 * global set so resumes could be PDFs would also have let a PDF be
 * uploaded as a company logo. Each consumer states what IT accepts.
 */
export function assertValidUpload(
  input: Pick<UploadInput, "buffer" | "contentType">,
  allowed: readonly string[] | undefined = ALLOWED_UPLOAD_MIME_TYPES
) {
  if (input.buffer.byteLength > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error(`File exceeds max upload size of ${MAX_UPLOAD_SIZE_BYTES} bytes.`);
  }
  const list = allowed ?? ALLOWED_UPLOAD_MIME_TYPES;
  if (!list.includes(input.contentType)) {
    throw new Error(`Content type "${input.contentType}" is not allowed. Allowed: ${list.join(", ")}`);
  }
}
