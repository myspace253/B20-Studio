import { NextRequest, NextResponse } from "next/server";
import { captureError } from "@/lib/monitoring";
import { z } from "zod";
import { isAddress } from "viem";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { verifyB20Deployment } from "@/lib/verifyDeployment";
import { rateLimit, tooManyRequests } from "@/lib/rateLimit";

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
    logoUrl: z.string().url().optional().or(z.literal("")),
  }),
  supply: z.object({
    variant: z.enum(["asset", "stablecoin"]),
    initialSupply: z.string().regex(/^[0-9]+$/),
    maximumSupply: z.string().regex(/^[0-9]+$/).optional(),
    decimals: z.number().int().min(6).max(18),
    currency: z.string().regex(/^[A-Z]+$/).optional(),
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
  // The wallet already signed and paid gas for this — see StepReview.tsx.
  // This route never sends a transaction itself.
  deployResult: z.object({
    contractAddress: z.string().refine((v) => isAddress(v)),
    txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    gasUsed: z.string(),
    effectiveGasPriceGwei: z.string(),
    totalCostEth: z.string(),
    network: z.enum(["base-mainnet", "base-sepolia"]),
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

  const limited = rateLimit(`create-token:${address.toLowerCase()}`, 10, 60_000);
  if (!limited.allowed) return tooManyRequests(limited);

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

  const { basicInfo, supply, roles, transferRules, tokenomics, deployResult } =
    parsed.data;

  // Never trust a client's claim of on-chain success at face value —
  // independently re-check the transaction against the RPC itself.
  const verification = await verifyB20Deployment({
    network: deployResult.network,
    txHash: deployResult.txHash as `0x${string}`,
    contractAddress: deployResult.contractAddress as `0x${string}`,
  });

  if (!verification.ok) {
    return NextResponse.json(
      { error: `Could not verify the deployment: ${verification.reason}` },
      { status: 422 }
    );
  }

  try {
    const normalizedAddress = address.toLowerCase();
    const symbol = basicInfo.symbol.toUpperCase();

    const token = await prisma.token.create({
      data: {
        name: basicInfo.name,
        symbol,
        variant: supply.variant,
        contractAddress: deployResult.contractAddress,
        network: deployResult.network,
        decimals: supply.decimals,
        initialSupply: supply.initialSupply,
        maximumSupply: supply.maximumSupply,
        mintable: supply.mintable,
        burnable: supply.burnable,
        pausable: supply.pausable,
        project: {
          connectOrCreate: {
            where: { id: `wallet:${normalizedAddress}` },
            create: {
              id: `wallet:${normalizedAddress}`,
              name: "My project",
              user: {
                connectOrCreate: {
                  where: { id: normalizedAddress },
                  create: {
                    id: normalizedAddress,
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
            logoUrl: basicInfo.logoUrl || undefined,
          },
        },
        transferRule: {
          create: { type: transferRules.type, value: transferRules.value },
        },
        tokenomics: { create: tokenomics },
        roles: { create: roles },
        deployments: {
          create: {
            txHash: deployResult.txHash,
            network: deployResult.network,
            status: "confirmed",
          },
        },
      },
    });

    return NextResponse.json(
      {
        id: token.id,
        status: "deployed",
        contractAddress: token.contractAddress,
        txHash: deployResult.txHash,
        gasUsed: deployResult.gasUsed,
        effectiveGasPriceGwei: deployResult.effectiveGasPriceGwei,
        totalCostEth: deployResult.totalCostEth,
      },
      { status: 201 }
    );
  } catch (err) {
    captureError(err, { route: "create-token", deployResult });
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
      { error: "Deployment succeeded on-chain but saving the record failed. Save your transaction hash and contact support." },
      { status: 500 }
    );
  }
}
