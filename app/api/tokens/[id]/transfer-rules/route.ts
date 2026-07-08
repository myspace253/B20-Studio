import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring";
import { z } from "zod";
import { getOwnedToken } from "@/lib/tokens";
import { prisma, withDatabaseFallback } from "@/lib/prisma";

const transferRuleSchema = z.object({
  type: z.enum([
    "allow_everyone",
    "whitelist_only",
    "blacklist",
    "country_restrictions",
    "kyc_required",
    "max_wallet",
    "max_transaction",
  ]),
  value: z.string().optional(),
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

  const parsed = transferRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    // NOTE: this persists the configured rule in Postgres only. Syncing
    // it to the live on-chain transfer policy needs the same B20 SDK call
    // as roles/mint/burn — see services/b20.ts. Treat this as the
    // intended state until that's wired in, not the enforced state.
    const rule = await withDatabaseFallback(
      () =>
        prisma.transferRule.upsert({
          where: { tokenId: id },
          update: parsed.data,
          create: { tokenId: id, ...parsed.data },
        }),
      null
    );

    return NextResponse.json({ rule }, { status: 200 });
  } catch (err) {
    captureError(err, { route: "tokens/[id]/transfer-rules", tokenId: id });
    return NextResponse.json(
      { error: "Could not save transfer rule." },
      { status: 500 }
    );
  }
}
