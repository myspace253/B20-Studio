import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getSessionAddress(): Promise<string | null> {
  const session = await auth();
  return session?.address?.toLowerCase() ?? null;
}

export async function getOwnedTokens() {
  const address = await getSessionAddress();
  if (!address) return [];

  return prisma.token.findMany({
    where: { project: { user: { wallets: { some: { address } } } } },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Returns the token only if it belongs to the signed-in wallet's project.
 * Returns null for both "doesn't exist" and "not yours" — the caller
 * should render the same not-found state either way, since leaking which
 * one it is would let someone probe for valid token IDs they don't own.
 */
export async function getOwnedToken(tokenId: string) {
  const address = await getSessionAddress();
  if (!address) return null;

  return prisma.token.findFirst({
    where: {
      id: tokenId,
      project: { user: { wallets: { some: { address } } } },
    },
    include: {
      metadata: true,
      roles: true,
      transferRule: true,
      tokenomics: true,
      frozenAddresses: true,
    },
  });
}

export async function getOwnedTransactions() {
  const address = await getSessionAddress();
  if (!address) return [];

  return prisma.transaction.findMany({
    where: { token: { project: { user: { wallets: { some: { address } } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { token: { select: { name: true, symbol: true } } },
  });
}
