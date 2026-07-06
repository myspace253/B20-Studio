import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { getOwnedToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";
import { verifyTokenActionTx } from "@/lib/verifyTokenAction";

const mintSchema = z.object({
  tokenId: z.string().min(1),
  recipient: z.string().refine((v) => isAddress(v), "Invalid address"),
  amount: z.string().regex(/^[0-9]+$/, "Whole base units only"),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const limitKey = session?.address?.toLowerCase() ?? getClientIp(req);
  const limited = rateLimit(`mint:${limitKey}`, 20, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = mintSchema.safeParse(body);
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

  if (!token.mintable) {
    return NextResponse.json(
      { error: "This token was not configured as mintable." },
      { status: 400 }
    );
  }

  const verification = await verifyTokenActionTx({
    network: token.network as "base-mainnet" | "base-sepolia",
    txHash: parsed.data.txHash as `0x${string}`,
    tokenAddress: token.contractAddress as `0x${string}`,
    functionName: "mint",
  });

  if (!verification.ok) {
    return NextResponse.json(
      { error: `Could not verify the mint: ${verification.reason}` },
      { status: 422 }
    );
  }

  await prisma.transaction.create({
    data: {
      tokenId: token.id,
      type: "mint",
      txHash: parsed.data.txHash,
      to: parsed.data.recipient,
      amount: parsed.data.amount,
    },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
