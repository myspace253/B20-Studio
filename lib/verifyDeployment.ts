import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";
import { B20_FACTORY_ADDRESS, b20FactoryAbi } from "@/contracts/b20";

const CHAIN_BY_NETWORK = { "base-mainnet": base, "base-sepolia": baseSepolia } as const;

const RPC_URL_BY_NETWORK: Record<keyof typeof CHAIN_BY_NETWORK, string | undefined> = {
  "base-mainnet": process.env.NEXT_PUBLIC_BASE_RPC_URL,
  "base-sepolia": process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
};

/**
 * Retry logic for RPC calls with exponential backoff.
 * Waits up to 30 seconds for RPC to index the transaction.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 6
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

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
  const rpcUrl = RPC_URL_BY_NETWORK[params.network];

  if (!rpcUrl) {
    return {
      ok: false,
      reason: `RPC URL not configured for network: ${params.network}`,
    };
  }

  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  let receipt;
  try {
    receipt = await withRetry(() =>
      client.getTransactionReceipt({ hash: params.txHash })
    );
  } catch (error) {
    return {
      ok: false,
      reason: `RPC error while fetching transaction after retries: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!receipt) {
    return {
      ok: false,
      reason: "Transaction not found on this network after waiting 30 seconds. Please verify the transaction hash and network are correct.",
    };
  }
  if (receipt.status !== "success") {
    return {
      ok: false,
      reason: `Transaction failed on-chain with status: ${receipt.status}`,
    };
  }
  if (!receipt.to || receipt.to.toLowerCase() !== B20_FACTORY_ADDRESS.toLowerCase()) {
    return {
      ok: false,
      reason: `Transaction was sent to ${receipt.to || "null"}, not the B20 factory at ${B20_FACTORY_ADDRESS}`,
    };
  }

  let isB20;
  try {
    isB20 = await client.readContract({
      address: B20_FACTORY_ADDRESS,
      abi: b20FactoryAbi,
      functionName: "isB20",
      args: [params.contractAddress],
    });
  } catch (error) {
    return {
      ok: false,
      reason: `Failed to verify B20 token at ${params.contractAddress}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!isB20) {
    return { ok: false, reason: "Reported address is not a real B20 token." };
  }

  return { ok: true };
}
