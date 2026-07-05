import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAddress } from "viem";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deployB20Token } from "@/services/b20";
import type { CreateTokenDraft } from "@/types/token";

const roleSchema = z.object({
  role: z.enum(["owner", "admin", "mint", "burn", "freeze", "transfer"]),
  address: z.string().refine((v) => isAddress(v), "Invalid address"),
});

const createTokenSchema = z.object({
  basicInfo: z.object({
    name: z.string().min(2).max(50),
    symbol: z.string().min(2).max(11),
    description: z.string().max(280).optional().or(z.literal("")),
    website: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    telegram: z.string().url().optional().or(z.literal("")),
    discord: z.string().url().optional().or(z.literal("")),
  }),
  supply: z.object({
    variant: z.enum(["asset", "stablecoin"]),
    initialSupply: z.string().regex(/^[0-9]+$/),
    maximumSupply: z.string().regex(/^[0-9]+$/).optional(),
    decimals: z.number().int().min(0).max(18),
    mintable: z.boolean(),
    burnable: z.boolean(),
    pausable: z.boolean(),
  }),
  roles: z.array(roleSchema),
  transferRules: z.object({
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
  }),
  tokenomics: z.object({
    treasury: z.number().min(0).max(100),
    team: z.number().min(0).max(100),
    community: z.number().min(0).max(100),
    liquidity: z.number().min(0).max(100),
    airdrop: z.number().min(0).max(100),
    reserve: z.number().min(0).max(100),
  }),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const address = session?.address;

  if (!address) {
    return NextResponse.json(
      { error: "Sign in with your wallet before creating a token." },
      { status: 401 }
    );
  }

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

  const { basicInfo, supply, roles, transferRules, tokenomics } = parsed.data;
  const normalizedAddress = address.toLowerCase();

  // Attempt the real on-chain deploy first. This always throws today —
  // deployB20Token is intentionally unimplemented until the B20 SDK is
  // confirmed — but it's called for real here so the moment that changes,
  // a successful call flows straight into a Deployment row and a real
  // contractAddress below, with no further wiring needed.
  let deployResult: { txHash: `0x${string}`; contractAddress: `0x${string}` } | null =
    null;
  try {
    const draft: CreateTokenDraft = {
      basicInfo: {
        name: basicInfo.name,
        symbol: basicInfo.symbol,
        description: basicInfo.description || "",
        website: basicInfo.website || undefined,
        twitter: basicInfo.twitter || undefined,
        telegram: basicInfo.telegram || undefined,
        discord: basicInfo.discord || undefined,
      },
      supply,
      roles,
      transferRules,
      tokenomics,
    };
    deployResult = await deployB20Token(draft, "base-sepolia");
  } catch {
    // Expected for now — see comment above. Fall through to draft-save.
  }

  try {
    const symbol = basicInfo.symbol.toUpperCase();

    const token = await prisma.token.create({
      data: {
        name: basicInfo.name,
        symbol,
        variant: supply.variant,
        contractAddress:
          deployResult?.contractAddress ?? `pending-${crypto.randomUUID()}`,
        decimals: supply.decimals,
        initialSupply: supply.initialSupply,
        maximumSupply: supply.maximumSupply,
        mintable: supply.mintable,
        burnable: supply.burnable,
        pausable: supply.pausable,
        project: {
          connectOrCreate: {
            // One default project per wallet for now — multi-project
            // support (the doc's "Projects" list) is a later addition once
            // there's a project-switcher UI to go with it.
            where: { id: `wallet:${normalizedAddress}` },
            create: {
              id: `wallet:${normalizedAddress}`,
              name: "My project",
              user: {
                connectOrCreate: {
                  where: { id: normalizedAddress },
                  create: {
                    id: normalizedAddress,
                    email: `${normalizedAddress}@wallet.local`,
                    wallets: { create: { address: normalizedAddress } },
                  },
                },
              },
            },
          },
        },
        metadata: {
          create: {
            description: basicInfo.description || undefined,
            website: basicInfo.website || undefined,
            twitter: basicInfo.twitter || undefined,
            telegram: basicInfo.telegram || undefined,
            discord: basicInfo.discord || undefined,
          },
        },
        transferRule: {
          create: { type: transferRules.type, value: transferRules.value },
        },
        tokenomics: { create: tokenomics },
        roles: { create: roles },
        ...(deployResult
          ? {
              deployments: {
                create: {
                  txHash: deployResult.txHash,
                  network: "base-sepolia",
                  status: "confirmed",
                },
              },
            }
          : {}),
      },
    });

    return NextResponse.json(
      deployResult
        ? {
            id: token.id,
            status: "deployed",
            contractAddress: token.contractAddress,
          }
        : {
            id: token.id,
            status: "draft_saved",
            message:
              "Draft saved with all wizard data. On-chain deployment is not wired up yet — see services/b20.ts.",
          },
      { status: 201 }
    );
  } catch (err) {
    console.error("Failed to save token", err);
    // Prisma's unique constraint error code — surface it as a real
    // validation message instead of a generic 500.
    if (
      typeof err === "object" &&
      err &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You already have a token with that symbol." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Could not save token. Check DATABASE_URL is set and reachable." },
      { status: 500 }
    );
  }
}
