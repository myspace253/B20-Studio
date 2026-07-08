import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { getOwnedToken } from "@/lib/tokens";
import { prisma, withDatabaseFallback } from "@/lib/prisma";
import { freezeB20Address, unfreezeB20Address } from "@/services/b20";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const freezeSchema = z.object({
  tokenId: z.string().min(1),
  address: z.string().refine((v) => isAddress(v), "Invalid address"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const limitKey = session?.address?.toLowerCase() ?? getClientIp(req);
  const limited = rateLimit(`freeze:${limitKey}`, 20, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = freezeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const token = await getOwnedToken(parsed.data.tokenId);
  if (!token) {
    return NextResponse.json(
      { error: "Token not found or you don't have access to it." },
      { status: 404 }
    );
  }

  try {
    const result = await freezeB20Address(
      token.contractAddress,
      parsed.data.address,
      token.network as "base-mainnet" | "base-sepolia"
    );

    await withDatabaseFallback(
      () =>
        prisma.$transaction([
          prisma.frozenAddress.upsert({
            where: {
              tokenId_address: { tokenId: token.id, address: parsed.data.address },
            },
            update: {},
            create: { tokenId: token.id, address: parsed.data.address },
          }),
          prisma.transaction.create({
            data: {
              tokenId: token.id,
              type: "freeze",
              txHash: result.txHash,
              to: parsed.data.address,
            },
          }),
        ]),
      null
    );

    return NextResponse.json({ txHash: result.txHash }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Freeze failed — chain call not implemented yet.",
      },
      { status: 501 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const limitKey = session?.address?.toLowerCase() ?? getClientIp(req);
  const limited = rateLimit(`freeze:${limitKey}`, 20, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("tokenId");
  const address = searchParams.get("address");

  if (!tokenId || !address || !isAddress(address)) {
    return NextResponse.json(
      { error: "tokenId and a valid address are required" },
      { status: 400 }
    );
  }

  const token = await getOwnedToken(tokenId);
  if (!token) {
    return NextResponse.json(
      { error: "Token not found or you don't have access to it." },
      { status: 404 }
    );
  }

  try {
    const result = await unfreezeB20Address(
      token.contractAddress,
      address,
      token.network as "base-mainnet" | "base-sepolia"
    );

    await withDatabaseFallback(
      () =>
        prisma.$transaction([
          prisma.frozenAddress.deleteMany({ where: { tokenId, address } }),
          prisma.transaction.create({
            data: {
              tokenId: token.id,
              type: "freeze", // same event type, distinguished by absence in frozenAddresses
              txHash: result.txHash,
              to: address,
            },
          }),
        ]),
      null
    );

    return NextResponse.json({ txHash: result.txHash }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unfreeze failed — chain call not implemented yet.",
      },
      { status: 501 }
    );
  }
}
