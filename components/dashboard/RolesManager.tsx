"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/FormControls";
import { truncateAddress } from "@/utils/format";

interface RoleRow {
  id: string;
  role: string;
  address: string;
}

export function RolesManager({ initialRoles }: { initialRoles: RoleRow[] }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [role, setRole] = useState("mint");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/tokens/${id}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, address }),
    });
    const body = await res.json();
    if (res.ok) {
      setRoles((prev) => [...prev, body.role]);
      setAddress("");
    } else {
      setError(body.error || "Failed to grant role");
    }
    setSubmitting(false);
  };

  const handleRevoke = async (roleId: string) => {
    await fetch(`/api/tokens/${id}/roles?roleId=${roleId}`, { method: "DELETE" });
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    router.refresh();
  };

  return (
    <div className="max-w-2xl space-y-8">
      <form onSubmit={handleGrant} className="flex flex-wrap items-end gap-4">
        <div className="w-40">
          <SelectField
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: "owner", label: "Owner" },
              { value: "admin", label: "Admin" },
              { value: "mint", label: "Mint" },
              { value: "burn", label: "Burn" },
              { value: "freeze", label: "Freeze" },
              { value: "transfer", label: "Transfer" },
            ]}
          />
        </div>
        <div className="flex-1">
          <TextField
            label="Address"
            placeholder="0x…"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-base px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim disabled:opacity-60"
        >
          Grant
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      <ul className="divide-y divide-line rounded-md border border-line">
        {roles.length === 0 && (
          <li className="px-5 py-4 text-sm text-fog">No roles granted yet.</li>
        )}
        {roles.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-5 py-3">
            <span className="text-sm text-white">
              {r.role} <span className="font-mono text-fog">{truncateAddress(r.address)}</span>
            </span>
            <button
              onClick={() => handleRevoke(r.id)}
              className="text-xs text-danger hover:underline"
            >
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
