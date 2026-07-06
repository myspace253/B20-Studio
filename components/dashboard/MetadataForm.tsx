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
    logoUrl?: string | null;
    bannerUrl?: string | null;
  };
}

function ImageUploadField({
  label,
  tokenId,
  kind,
  currentUrl,
  onUploaded,
}: {
  label: string;
  tokenId: string;
  kind: "logo" | "banner";
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId, kind, contentType: file.type }),
      });
      const presignBody = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignBody.error || "Could not start upload");
      }

      const putRes = await fetch(presignBody.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("Upload to storage failed");
      }

      onUploaded(presignBody.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="text-sm font-medium text-white">{label}</span>
      <div className="mt-2 flex items-center gap-4">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, not worth next/image config for a scaffold
          <img
            src={currentUrl}
            alt={label}
            className="h-12 w-12 rounded-sm border border-line object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-dashed border-line text-[10px] text-fog">
            None
          </div>
        )}
        <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-fog hover:text-white">
          {uploading ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function MetadataForm({ initial }: MetadataFormProps) {
  const { id } = useParams<{ id: string }>();
  const [values, setValues] = useState({
    description: initial.description ?? "",
    website: initial.website ?? "",
    twitter: initial.twitter ?? "",
    telegram: initial.telegram ?? "",
    discord: initial.discord ?? "",
    logoUrl: initial.logoUrl ?? "",
    bannerUrl: initial.bannerUrl ?? "",
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploadField
          label="Logo"
          tokenId={id}
          kind="logo"
          currentUrl={values.logoUrl}
          onUploaded={(url) => setValues((v) => ({ ...v, logoUrl: url }))}
        />
        <ImageUploadField
          label="Banner"
          tokenId={id}
          kind="banner"
          currentUrl={values.bannerUrl}
          onUploaded={(url) => setValues((v) => ({ ...v, bannerUrl: url }))}
        />
      </div>

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
