"use client";

import { useCallback, useState } from "react";
import { useWriteContract, usePublicClient } from "wagmi";
import { formatGwei, formatEther } from "viem";
import type { WriteContractParameters } from "wagmi/actions";

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
 */
export function useB20Transaction() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
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
          throw new Error("Transaction reverted on-chain.");
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
