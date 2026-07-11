"use client";

import { useCallback, useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { formatGwei, formatEther } from "viem";
import type { WriteContractParameters } from "wagmi/actions";
import { decodeRevertReason } from "@/lib/b20-errors";

export interface B20TxResult {
  txHash: `0x${string}`;
  gasUsed: bigint;
  effectiveGasPriceGwei: string;
  totalCostEth: string;
  blockNumber: bigint;
}

export type B20TxStatus = "idle" | "signing" | "confirming" | "success" | "error";

/**
 * Wraps wagmi's writeContract + waitForTransactionReceipt so every B20
 * action (deploy, mint, burn, freeze) reports the same real, on-chain gas
 * numbers instead of each page reimplementing this. The wallet signs and
 * pays gas — this hook never touches a private key.
 *
 * chainId is required, not inferred from the wallet's current chain.
 * usePublicClient() with no chainId returns whatever chain the wallet was
 * on when this hook last rendered — if a caller switches chains inside
 * the same async flow (StepReview.tsx does, right before deploying),
 * that value doesn't update mid-function. writeContractAsync still signs
 * against the right chain (it takes an explicit chainId in its config),
 * but waitForTransactionReceipt would then poll the *old* chain for a
 * hash that only exists on the new one — it never finds it, and the
 * whole deploy reports as failed even though it succeeded on-chain.
 */
export function useB20Transaction(chainId: number) {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId });
  const [status, setStatus] = useState<B20TxStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<B20TxResult | null>(null);

  const send = useCallback(
    async (config: WriteContractParameters) => {
      setStatus("signing");
      setError(null);
      setResult(null);
      try {
        const hash = await writeContractAsync(config);
        setStatus("confirming");

        if (!publicClient) throw new Error("No RPC client available");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          if (!publicClient) throw new Error("Transaction reverted on-chain.");
          const tx = await publicClient.getTransaction({ hash });
          const reason = await decodeRevertReason(publicClient, {
            to: tx.to as `0x${string}`,
            data: tx.input,
            from: tx.from,
            blockNumber: receipt.blockNumber,
          });
          throw new Error(reason);
        }

        const gasUsed = receipt.gasUsed;
        const effectiveGasPrice = receipt.effectiveGasPrice ?? 0n;
        const txResult: B20TxResult = {
          txHash: hash,
          gasUsed,
          effectiveGasPriceGwei: formatGwei(effectiveGasPrice),
          totalCostEth: formatEther(gasUsed * effectiveGasPrice),
          blockNumber: receipt.blockNumber,
        };
        setResult(txResult);
        setStatus("success");
        return { receipt, ...txResult };
      } catch (err) {
        setStatus("error");
        const message =
          err instanceof Error ? err.message : "Transaction failed";
        setError(message);
        throw new Error(message);
      }
    },
    [writeContractAsync, publicClient]
  );

  return { send, status, error, result };
}
