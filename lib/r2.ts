import { S3Client } from "@aws-sdk/client-s3";

/**
 * R2 is S3-compatible, so the standard AWS SDK v3 client works against it
 * unmodified — only the endpoint and region differ from real S3.
 * Throws at call time (not at import time) if env vars are missing, so
 * importing this file in a route that doesn't actually upload never fails.
 */
export function getR2Client() {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 is not configured — set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, and CLOUDFLARE_R2_SECRET_ACCESS_KEY."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET ?? "base-studio";

/**
 * R2's own public dev URL or a custom domain mapped to the bucket —
 * see https://developers.cloudflare.com/r2/buckets/public-buckets/
 */
export function getPublicUrl(key: string): string {
  const base = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!base) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL is not set.");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}
