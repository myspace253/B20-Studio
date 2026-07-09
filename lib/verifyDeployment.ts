import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { B20_FACTORY_ADDRESS, b20FactoryAbi } from "@/contracts/b20";

const CHAIN_BY_NETWORK = { "base-mainnet": base, "base-sepolia": baseSepolia } as const;

const RPC_URL_BY_NETWORK: Record<keyof typeof CHAIN_BY_NETWORK, string | undefined> = {
  "base-mainnet": process.env.NEXT_PUBLIC_BASE_RPC_URL,
  "base-sepolia": process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
};

/**
 * Re-checks a client-reported deploy against the chain itself, rather than
 * trusting txHash/contractAddress fields a browser could simply lie about.
 * Confirms: the transaction exists and succeeded, it was actually sent to
 * the B20 factory (not some unrelated call), and the reported address is
 * a real, initialized B20 token.
 */
export async function verifyB20Deployment(params: {
  network: keyof typeof CHAIN_BY_NETWORK;
  txHash: `0x${string}`;
  contractAddress: `0x${string}`;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const chain = CHAIN_BY_NETWORK[params.network];
  const client = createPublicClient({
    chain,
    transport: http(RPC_URL_BY_NETWORK[params.network]),
  });

  const receipt = await client
    .getTransactionReceipt({ hash: params.txHash })
    .catch(() => null);

  if (!receipt) {
    return { ok: false, reason: "Transaction not found on this network." };
  }
  if (receipt.status !== "success") {
    return { ok: false, reason: "Transaction did not succeed on-chain." };
  }
  if (receipt.to?.toLowerCase() !== B20_FACTORY_ADDRESS.toLowerCase()) {
    return { ok: false, reason: "Transaction was not sent to the B20 factory." };
  }

  // isB20 (not used here) only confirms the address is B20-shaped — per
  // the docs, the variant is "recoverable from the address alone without
  // an RPC call," which means isB20 can pass for an address that was
  // never actually created. isB20Initialized is the one that checks real
  // deployment state, which is what this function claims to verify.
  const isInitialized = await client.readContract({
    address: B20_FACTORY_ADDRESS,
    abi: b20FactoryAbi,
    functionName: "isB20Initialized",
    args: [params.contractAddress],
  });

  if (!isInitialized) {
    return { ok: false, reason: "Reported address is not a real B20 token." };
  }

  return { ok: true };
}
