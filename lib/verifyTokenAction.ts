import { createPublicClient, http, decodeFunctionData } from "viem";
import { base, baseSepolia } from "viem/chains";
import { b20TokenAbi } from "@/contracts/b20";

const CHAIN_BY_NETWORK = { "base-mainnet": base, "base-sepolia": baseSepolia } as const;

const RPC_URL_BY_NETWORK: Record<keyof typeof CHAIN_BY_NETWORK, string | undefined> = {
  "base-mainnet": process.env.NEXT_PUBLIC_BASE_RPC_URL,
  "base-sepolia": process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL,
};

export async function verifyTokenActionTx(params: {
  network: keyof typeof CHAIN_BY_NETWORK;
  txHash: `0x${string}`;
  tokenAddress: `0x${string}`;
  functionName: "mint" | "burn" | "burnBlocked";
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const chain = CHAIN_BY_NETWORK[params.network];
  const client = createPublicClient({
    chain,
    transport: http(RPC_URL_BY_NETWORK[params.network]),
  });

  const [receipt, tx] = await Promise.all([
    client.getTransactionReceipt({ hash: params.txHash }).catch(() => null),
    client.getTransaction({ hash: params.txHash }).catch(() => null),
  ]);

  if (!receipt || !tx) {
    return { ok: false, reason: "Transaction not found on this network." };
  }
  if (receipt.status !== "success") {
    return { ok: false, reason: "Transaction did not succeed on-chain." };
  }
  if (receipt.to?.toLowerCase() !== params.tokenAddress.toLowerCase()) {
    return { ok: false, reason: "Transaction was not sent to this token." };
  }

  try {
    const decoded = decodeFunctionData({ abi: b20TokenAbi, data: tx.input });
    if (decoded.functionName !== params.functionName) {
      return {
        ok: false,
        reason: `Expected a ${params.functionName} call, got ${decoded.functionName}.`,
      };
    }
  } catch {
    return { ok: false, reason: "Could not decode transaction calldata." };
  }

  return { ok: true };
}
