import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

const metadataSchema = z.object({
  description: z.string().max(280).optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  telegram: z.string().url().optional().or(z.literal("")),
  discord: z.string().url().optional().or(z.literal("")),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) {
    return NextResponse.json(
      { error: "Token not found or you don't have access to it." },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = metadataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const metadata = await prisma.metadata.upsert({
    where: { tokenId: id },
    update: parsed.data,
    create: { tokenId: id, ...parsed.data },
  });

  return NextResponse.json({ metadata }, { status: 200 });
}
