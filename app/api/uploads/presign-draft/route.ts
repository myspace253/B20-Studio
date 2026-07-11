import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { getR2Client, R2_BUCKET, getPublicUrl } from "@/lib/r2";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const presignSchema = z.object({
  contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
});

/**
 * Mirrors /api/uploads/presign, but for the create wizard's Image field,
 * which runs before a token exists in the DB — there's no tokenId to
 * scope the object key or ownership check to yet. Scoped by the
 * authenticated wallet instead (`drafts/{address}/...`), same as how
 * create-token's own project/user records key off the wallet before any
 * token row exists. The resulting public URL is stable across the
 * upload → deploy → create-token round trip, so no follow-up move/rename
 * step is needed — StepBasicInfo.tsx passes the URL straight through in
 * basicInfo.logoUrl and create-token/route.ts writes it directly into
 * Metadata.logoUrl.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const address = session?.address;

  if (!address) {
    return NextResponse.json(
      { error: "Sign in with your wallet before uploading an image." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(parsed.data.contentType)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const normalizedAddress = address.toLowerCase();
  const limited = rateLimit(`upload-draft:${normalizedAddress}`, 10, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  const extension = EXTENSION_BY_TYPE[parsed.data.contentType];
  const key = `drafts/${normalizedAddress}/${Date.now()}-logo.${extension}`;

  try {
    const client = getR2Client();
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: parsed.data.contentType,
      }),
      { expiresIn: 300 }
    );

    return NextResponse.json(
      { uploadUrl, publicUrl: getPublicUrl(key) },
      { status: 200 }
    );
  } catch (err) {
    captureError(err, { route: "uploads/presign-draft", address: normalizedAddress });
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Could not create an upload URL. Check R2 credentials are set.",
      },
      { status: 500 }
    );
  }
}
