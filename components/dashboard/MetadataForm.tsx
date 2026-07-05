"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { TextField, TextAreaField } from "@/components/ui/TextField";

interface MetadataFormProps {
  initial: {
    description?: string | null;
    website?: string | null;
    twitter?: string | null;
    telegram?: string | null;
    discord?: string | null;
  };
}

function MetadataForm({ initial }: MetadataFormProps) {
  const { id } = useParams<{ id: string }>();
  const [values, setValues] = useState({
    description: initial.description ?? "",
    website: initial.website ?? "",
    twitter: initial.twitter ?? "",
    telegram: initial.telegram ?? "",
    discord: initial.discord ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(null);
    const res = await fetch(`/api/tokens/${id}/metadata`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = await res.json();
    setSaved(res.ok ? "Saved." : body.error || "Failed to save.");
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <TextAreaField
        label="Description"
        rows={4}
        value={values.description}
        onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Website"
          value={values.website}
          onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
        />
        <TextField
          label="Twitter / X"
          value={values.twitter}
          onChange={(e) => setValues((v) => ({ ...v, twitter: e.target.value }))}
        />
        <TextField
          label="Telegram"
          value={values.telegram}
          onChange={(e) => setValues((v) => ({ ...v, telegram: e.target.value }))}
        />
        <TextField
          label="Discord"
          value={values.discord}
          onChange={(e) => setValues((v) => ({ ...v, discord: e.target.value }))}
        />
      </div>
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

export { MetadataForm };
