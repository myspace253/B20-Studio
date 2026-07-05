"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TextField } from "@/components/ui/TextField";

export default function BurnPage() {
  const { id } = useParams<{ id: string }>();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/burn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: id, amount }),
      });
      const body = await res.json();
      setResult({
        ok: res.ok,
        message: res.ok
          ? `Burned. Tx: ${body.txHash}`
          : body.error || "Burn failed.",
      });
    } catch {
      setResult({ ok: false, message: "Network error — request didn't reach the server." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <TextField
        label="Amount"
        placeholder="1000"
        hint="Whole units, burned from the issuer's own balance"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-danger px-6 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? "Burning…" : "Burn"}
      </button>

      {result && (
        <p className={`text-sm ${result.ok ? "text-signal" : "text-danger"}`}>
          {result.message}
        </p>
      )}
    </form>
  );
}
