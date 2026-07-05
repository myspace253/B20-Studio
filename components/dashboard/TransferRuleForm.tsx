"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/FormControls";
import { transferRuleTypes } from "@/lib/schemas/transferRules";

interface TransferRuleFormProps {
  initial: { type: string; value?: string | null } | null;
}

export function TransferRuleForm({ initial }: TransferRuleFormProps) {
  const { id } = useParams<{ id: string }>();
  const [type, setType] = useState(initial?.type ?? "allow_everyone");
  const [value, setValue] = useState(initial?.value ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const needsValue = ["max_wallet", "max_transaction", "country_restrictions"].includes(
    type
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(null);
    const res = await fetch(`/api/tokens/${id}/transfer-rules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, value: needsValue ? value : undefined }),
    });
    const body = await res.json();
    setSaved(res.ok ? "Saved." : body.error || "Failed to save.");
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <p className="rounded-md border border-line bg-surface px-4 py-3 text-xs text-fog">
        This saves your intended rule. Syncing it to the live on-chain
        transfer policy requires the same B20 SDK wiring as roles and
        mint/burn — see <code className="text-muted">services/b20.ts</code>.
      </p>

      <SelectField
        label="Rule type"
        value={type}
        onChange={(e) => setType(e.target.value)}
        options={transferRuleTypes.map((t) => ({ value: t.value, label: t.label }))}
      />

      {needsValue && (
        <TextField
          label="Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      )}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
      {saved && <p className="text-sm text-signal">{saved}</p>}
    </form>
  );
}
