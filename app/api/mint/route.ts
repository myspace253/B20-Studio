import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { getOwnedToken } from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { mintB20Token } from "@/services/b20";

const mintSchema = z.object({
  tokenId: z.string().min(1),
  recipient: z.string().refine((v) => isAddress(v), "Invalid address"),
  amount: z.string().regex(/^[0-9]+$/, "Whole units only"),
});

export async function POST(req: NextRequest) {
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

  // getOwnedToken already scopes to the signed-in wallet, so a missing
  // result covers "not signed in", "doesn't exist", and "not yours" alike.
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

  try {
    const result = await mintB20Token(
      token.contractAddress,
      parsed.data.recipient,
      parsed.data.amount,
      "base-sepolia"
    );

    // Only reached once mintB20Token is actually implemented — wired now
    // so nothing else needs to change when that happens.
    await prisma.transaction.create({
      data: {
        tokenId: token.id,
        type: "mint",
        txHash: result.txHash,
        to: parsed.data.recipient,
        amount: parsed.data.amount,
      },
    });

    return NextResponse.json({ txHash: result.txHash }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Mint failed — chain call not implemented yet.",
      },
      { status: 501 }
    );
  }
}
