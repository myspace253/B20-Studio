import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOwnedToken } from "@/lib/tokens";
import { prisma, withDatabaseFallback } from "@/lib/prisma";
import { burnB20Token } from "@/services/b20";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp, tooManyRequests } from "@/lib/rateLimit";

const burnSchema = z.object({
  tokenId: z.string().min(1),
  amount: z.string().regex(/^[0-9]+$/, "Whole units only"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const limitKey = session?.address?.toLowerCase() ?? getClientIp(req);
  const limited = rateLimit(`burn:${limitKey}`, 20, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = burnSchema.safeParse(body);
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

  if (!token.burnable) {
    return NextResponse.json(
      { error: "This token was not configured as burnable." },
      { status: 400 }
    );
  }

  try {
    const result = await burnB20Token(
      token.contractAddress,
      parsed.data.amount,
      token.network as "base-mainnet" | "base-sepolia"
    );

    await withDatabaseFallback(
      () =>
        prisma.transaction.create({
          data: {
            tokenId: token.id,
            type: "burn",
            txHash: result.txHash,
            amount: parsed.data.amount,
          },
        }),
      null
    );

    return NextResponse.json({ txHash: result.txHash }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Burn failed — chain call not implemented yet.",
      },
      { status: 501 }
    );
  }
}
