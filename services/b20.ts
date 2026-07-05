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
 * None of these are implemented yet — same reasoning as deployB20Token:
 * the real precompile call encoding depends on Base's Standard Library,
 * which isn't confirmed. Throwing explicitly here means the mint/burn API
 * routes surface a clear "not implemented" error instead of silently
 * recording a fake on-chain action.
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

export async function mintB20Token(
  _contractAddress: string,
  _recipient: string,
  _amount: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "mintB20Token is not implemented — wire the Base B20 SDK mint call before using this in production."
  );
}

export async function burnB20Token(
  _contractAddress: string,
  _amount: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "burnB20Token is not implemented — wire the Base B20 SDK burn call before using this in production."
  );
}

export async function freezeB20Address(
  _contractAddress: string,
  _address: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "freezeB20Address is not implemented — wire the Base B20 SDK freeze call before using this in production."
  );
}

export async function unfreezeB20Address(
  _contractAddress: string,
  _address: string,
  _network: Network
): Promise<{ txHash: `0x${string}` }> {
  throw new Error(
    "unfreezeB20Address is not implemented — wire the Base B20 SDK freeze call before using this in production."
  );
}
