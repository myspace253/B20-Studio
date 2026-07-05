"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { truncateAddress } from "@/utils/format";

interface FrozenAddressRow {
  id: string;
  address: string;
}

export function FreezeManager({
  initialFrozen,
  freezeRoleConfigured,
}: {
  initialFrozen: FrozenAddressRow[];
  freezeRoleConfigured: boolean;
}) {
  const { id } = useParams<{ id: string }>();
  const [frozen, setFrozen] = useState(initialFrozen);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/freeze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: id, address }),
    });
    const body = await res.json();
    if (res.ok) {
      setFrozen((prev) => [...prev, { id: address, address }]);
      setAddress("");
    } else {
      setError(body.error || "Freeze failed.");
    }
    setSubmitting(false);
  };

  const handleUnfreeze = async (addr: string) => {
    const res = await fetch(
      `/api/freeze?tokenId=${id}&address=${addr}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setFrozen((prev) => prev.filter((f) => f.address !== addr));
    }
  };

  if (!freezeRoleConfigured) {
    return (
      <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
        <p className="text-sm text-muted">
          No freeze role was assigned to this token in Permissions, so
          freezing isn&apos;t available.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={handleFreeze} className="flex items-end gap-4">
        <div className="flex-1">
          <TextField
            label="Address to freeze"
            placeholder="0x…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-danger px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
        >
          Freeze
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      <ul className="divide-y divide-line rounded-md border border-line">
        {frozen.length === 0 && (
          <li className="px-5 py-4 text-sm text-fog">
            No addresses frozen. Freezing requires the on-chain call in{" "}
            <code className="text-muted">services/b20.ts</code>, which
            isn&apos;t wired in yet — freeze requests will currently fail.
          </li>
        )}
        {frozen.map((f) => (
          <li key={f.id} className="flex items-center justify-between px-5 py-3">
            <span className="font-mono text-sm text-white">
              {truncateAddress(f.address)}
            </span>
            <button
              onClick={() => handleUnfreeze(f.address)}
              className="text-xs text-signal hover:underline"
            >
              Unfreeze
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
