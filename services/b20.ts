import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import type { CreateTokenDraft } from "@/types/token";

export const publicClients = {
  "base-mainnet": createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
  }),
  "base-sepolia": createPublicClient({
    chain: baseSepolia,
    transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL),
  }),
} as const;

export type Network = keyof typeof publicClients;

export interface DeployTokenResult {
  txHash: `0x${string}`;
  contractAddress: `0x${string}`;
}

/**
 * Not implemented yet — this is where the actual B20 activation call goes
 * once the Base B20 SDK (or the raw precompile call encoding from
 * contracts/b20.ts) is confirmed. Left as an explicit throw rather than a
 * silent mock so nothing downstream mistakes a stub for a real deployment.
 */
export async function deployB20Token(
  _draft: CreateTokenDraft,
  _network: Network
): Promise<DeployTokenResult> {
  throw new Error(
    "deployB20Token is not implemented — wire the Base B20 SDK or the " +
      "Activation Registry call from contracts/b20.ts before using this in production."
  );
}
