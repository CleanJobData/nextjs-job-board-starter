import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import type { StorageAdapter, UploadInput, UploadResult } from "./types";
import { assertValidUpload } from "./types";

export interface S3AdapterConfig {
  bucket: string;
  region: string;
  /** Only set for S3-compatible-but-not-AWS providers (Cloudflare R2, MinIO, etc). Leave unset for real AWS S3. */
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /**
   * When set, uploaded files are assumed publicly readable and `upload()`
   * returns a plain `${publicUrlBase}/${key}` URL - no per-request signing
   * cost, but the bucket (or a CDN in front of it) must actually be
   * configured for public read.
   *
   * When unset (the default), we assume the bucket is private and instead
   * return a presigned GET URL. This is the safer default for a starter
   * template - it works out of the box against a bucket with default
   * (private) ACLs, at the cost of URLs that expire (see
   * PRESIGNED_URL_EXPIRY_SECONDS) and therefore aren't safe to cache
   * long-term. Set S3_PUBLIC_URL_BASE once you've deliberately made the
   * bucket/prefix public (e.g. behind a CDN) and want stable, non-expiring
   * URLs instead.
   */
  publicUrlBase?: string;
}

const PRESIGNED_URL_EXPIRY_SECONDS = 60 * 60; // 1 hour - long enough to load a page, short enough to bound exposure of a private object.

function safeExt(filename: string): string {
  const match = /\.[a-zA-Z0-9]{1,10}$/.exec(filename);
  return match ? match[0].toLowerCase() : "";
}

class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;

  constructor(private config: S3AdapterConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      // R2/MinIO need path-style addressing; real AWS S3 works fine with it too.
      forcePathStyle: Boolean(config.endpoint),
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    assertValidUpload(input);

    const key = `${input.scope}/${nanoid(16)}${safeExt(input.filename)}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.contentType,
      })
    );

    const url = this.config.publicUrlBase
      ? `${this.config.publicUrlBase.replace(/\/$/, "")}/${key}`
      : await getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.config.bucket, Key: key }), {
          expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
        });

    return { key, url };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }
}

export function createS3StorageAdapter(config: S3AdapterConfig): StorageAdapter {
  return new S3StorageAdapter(config);
}
