"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAccount, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { parseUnits, isAddress } from "viem";
import { TextField } from "@/components/ui/TextField";
import { useB20Transaction } from "@/hooks/useB20Transaction";
import { b20TokenAbi } from "@/contracts/b20";

const CHAIN_BY_NETWORK = { "base-mainnet": base, "base-sepolia": baseSepolia } as const;

interface MintFormProps {
  contractAddress: `0x${string}`;
  decimals: number;
  network: "base-mainnet" | "base-sepolia";
}

export function MintForm({ contractAddress, decimals, network }: MintFormProps) {
  const { id } = useParams<{ id: string }>();
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const targetChain = CHAIN_BY_NETWORK[network];
  const { send, status } = useB20Transaction(targetChain.id);

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const busy = status === "signing" || status === "confirming";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!isAddress(recipient)) {
      setResult({ ok: false, message: "Enter a valid recipient address." });
      return;
    }

    try {
      if (chainId !== targetChain.id) {
        await switchChainAsync({ chainId: targetChain.id });
      }

      const amountBaseUnits = parseUnits(amount, decimals);

      const tx = await send({
        address: contractAddress,
        abi: b20TokenAbi,
        functionName: "mint",
        args: [recipient, amountBaseUnits],
        chainId: targetChain.id,
      });

      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: id,
          recipient,
          amount: amountBaseUnits.toString(),
          txHash: tx.txHash,
        }),
      });
      const body = await res.json();

      setResult({
        ok: res.ok,
        message: res.ok
          ? `Minted. Gas: ${tx.gasUsed.toString()} @ ${tx.effectiveGasPriceGwei} gwei (${tx.totalCostEth} ETH). Tx: ${tx.txHash}`
          : body.error || "Saving the mint record failed.",
      });
    } catch (err) {
      setResult({
        ok: false,
        message: err instanceof Error ? err.message : "Mint failed.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <TextField
        label="Recipient"
        placeholder="0x…"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        required
      />
      <TextField
        label="Amount"
        placeholder="1000"
        hint={`Human units — converted to base units using ${decimals} decimals`}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim disabled:opacity-60"
      >
        {status === "signing"
          ? "Confirm in your wallet…"
          : status === "confirming"
            ? "Confirming on-chain…"
            : "Mint"}
      </button>

      {result && (
        <p className={`text-sm ${result.ok ? "text-signal" : "text-danger"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
