# lib/storage

A small, feature-agnostic file storage module (`StorageAdapter` in `types.ts`).
Not owned by any single feature - job-posting's company logo upload is the
first consumer, but resume uploads (or anything else needing to persist a
user-supplied file) should reuse this instead of rolling its own.

```ts
import { getStorageAdapter } from "@/lib/storage";

const adapter = getStorageAdapter();
const { key, url } = await adapter.upload({
  buffer,
  filename: file.name,
  contentType: file.type,
  scope: "company-logos",
});
// ...later, to remove it:
await adapter.delete(key);
```

`scope` namespaces uploads so unrelated features sharing one bucket/disk
don't collide (`"company-logos"`, later `"resumes"`, etc).

Max upload size (5MB) and allowed mime types (images only, for now - the
only current consumer is company logos) are enforced in `types.ts`'s
`assertValidUpload()`, called by every adapter. There's no per-caller
override yet - widen the shared constants when a real need shows up.

## Choosing a provider

Set `STORAGE_PROVIDER` to `local` (the default if unset) or `s3`. This is
an env var, not a `features.config.ts` entry, deliberately: storage
credentials are secrets, and `features.config.ts` is a checked-in file -
env vars are the only place these belong.

### `local` (default)

Writes to a gitignored `uploads/` directory at the repo root, served back
out through `app/api/uploads/[...path]/route.ts`. No extra env vars
required.

**Only suitable for self-hosted deployments with a persistent disk.**
On a serverless platform (Vercel, etc.) the filesystem a function instance
writes to does not survive past that invocation, and often isn't even
shared across concurrently-running instances - an upload would appear to
succeed and then 404 on the next request. Use `s3` for any serverless
deployment.

Uploads are intentionally kept out of `public/`: serving arbitrary
user-uploaded files straight from `public/` puts them under Next's static
asset serving/caching with no content-type or access control of our own.

### `s3`

An S3-compatible adapter (`lib/storage/s3.ts`) built on AWS SDK v3
(`@aws-sdk/client-s3`) - works against real AWS S3, Cloudflare R2, MinIO,
or anything else that speaks the S3 API, via a configurable `S3_ENDPOINT`.

Required env vars:

- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

Optional:

- `S3_ENDPOINT` - only for non-AWS S3-compatible providers (e.g. Cloudflare
  R2's account-scoped endpoint). Leave unset for real AWS S3.
- `S3_PUBLIC_URL_BASE` - if set, uploaded files are assumed to be served
  from a public bucket/CDN and `upload()` returns a stable
  `${S3_PUBLIC_URL_BASE}/<key>` URL. If unset (the default), the bucket is
  assumed private and `upload()` returns a presigned GET URL instead (valid
  for 1 hour) - this is the safer default since it works against a bucket
  with default (private) ACLs with no extra setup, at the cost of URLs
  that expire and so shouldn't be cached/stored long-term as-is. Set
  `S3_PUBLIC_URL_BASE` once you've deliberately made the bucket (or a CDN
  in front of it) public.

## Adding a new adapter

Implement `StorageAdapter` from `types.ts` and wire it into
`createStorageAdapter()` in `index.ts` behind a new `STORAGE_PROVIDER`
value.
