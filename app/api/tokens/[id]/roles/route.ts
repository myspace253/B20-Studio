import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { getOwnedToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";

const grantSchema = z.object({
  role: z.enum(["owner", "admin", "mint", "burn", "freeze", "transfer"]),
  address: z.string().refine((v) => isAddress(v), "Invalid address"),
});

export async function POST(
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

  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // NOTE: this only records the intent in Postgres. Granting a role
  // on-chain requires the same B20 SDK call as mint/burn/deploy — see
  // services/b20.ts. Surfacing it as "saved" without that would be
  // misleading, so the UI should treat this as a pending change until
  // deployB20Token-equivalent role management is wired in.
  const grant = await prisma.tokenRole.create({
    data: { tokenId: id, role: parsed.data.role, address: parsed.data.address },
  });

  return NextResponse.json({ role: grant }, { status: 201 });
}

export async function DELETE(
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

  const { searchParams } = new URL(req.url);
  const roleId = searchParams.get("roleId");
  if (!roleId) {
    return NextResponse.json({ error: "roleId is required" }, { status: 400 });
  }

  await prisma.tokenRole.deleteMany({ where: { id: roleId, tokenId: id } });
  return NextResponse.json({ ok: true }, { status: 200 });
}
