import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createTokenSchema = z.object({
  name: z.string().min(2).max(50),
  symbol: z.string().min(2).max(11),
  variant: z.enum(["asset", "stablecoin"]),
  initialSupply: z.string().regex(/^[0-9]+$/),
  decimals: z.number().int().min(0).max(18),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // TODO(auth): resolve the authenticated user/project once Clerk or Privy
  // is wired in — right now this has no owner association and will fail
  // once the schema's required relations are enforced against real data.
  //
  // TODO(chain): call services/b20.ts#deployB20Token once the Base B20 SDK
  // (or Activation Registry precompile call) is confirmed. Until then this
  // only persists a "draft" row so the wizard flow is exercisable end to end
  // without silently pretending a token was actually deployed on-chain.
  try {
    const draft = await prisma.token.create({
      data: {
        name: parsed.data.name,
        symbol: parsed.data.symbol,
        variant: parsed.data.variant,
        contractAddress: `pending-${crypto.randomUUID()}`,
        decimals: parsed.data.decimals,
        initialSupply: parsed.data.initialSupply,
        // projectId is required by the schema — placeholder until auth is wired.
        project: {
          connectOrCreate: {
            where: { id: "unassigned" },
            create: {
              id: "unassigned",
              name: "Unassigned",
              user: {
                connectOrCreate: {
                  where: { email: "[email protected]" },
                  create: { email: "[email protected]" },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: draft.id,
        status: "draft_saved",
        message:
          "Draft saved. On-chain deployment is not wired up yet — see services/b20.ts.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to save token draft", err);
    return NextResponse.json(
      { error: "Could not save draft. Check DATABASE_URL is set and reachable." },
      { status: 500 }
    );
  }
}
