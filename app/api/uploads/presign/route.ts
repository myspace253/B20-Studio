import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getOwnedToken } from "@/lib/tokens";
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
  tokenId: z.string().min(1),
  kind: z.enum(["logo", "banner"]),
  contentType: z.enum(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]),
});

export async function POST(req: NextRequest) {
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

  const token = await getOwnedToken(parsed.data.tokenId);
  if (!token) {
    return NextResponse.json(
      { error: "Token not found or you don't have access to it." },
      { status: 404 }
    );
  }

  const limited = rateLimit(`upload:${token.id}`, 10, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  const extension = EXTENSION_BY_TYPE[parsed.data.contentType];
  const key = `tokens/${token.id}/${parsed.data.kind}-${Date.now()}.${extension}`;

  try {
    const client = getR2Client();
    const uploadUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        ContentType: parsed.data.contentType,
      }),
      { expiresIn: 300 } // 5 minutes to complete the upload
    );

    return NextResponse.json(
      { uploadUrl, publicUrl: getPublicUrl(key) },
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to create presigned upload URL", err);
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
