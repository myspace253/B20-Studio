"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  basicInfoSchema,
  type BasicInfoFormValues,
} from "@/lib/schemas/basicInfo";
import { TextField, TextAreaField } from "@/components/ui/TextField";
import { StepFooter } from "@/components/wizard/StepFooter";

interface StepBasicInfoProps {
  defaultValues?: Partial<BasicInfoFormValues>;
  onNext: (values: BasicInfoFormValues) => void;
}

/**
 * Uploads through /api/uploads/presign-draft rather than
 * /api/uploads/presign — this runs before the token exists in the DB
 * (deploy hasn't happened yet), so there's no tokenId to scope an
 * ownership check to. See that route's docstring for how the resulting
 * URL survives the upload → deploy → create-token round trip.
 */
function LogoUploadField({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const presignRes = await fetch("/api/uploads/presign-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
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

      onChange(presignBody.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <span className="text-sm font-medium text-white">
        Image <span className="text-fog">(optional)</span>
      </span>
      <div className="mt-2 flex items-center gap-4">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- external R2 URL, not worth next/image config for a scaffold
          <img
            src={value}
            alt="Token logo"
            className="h-12 w-12 rounded-sm border border-line object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-dashed border-line text-[10px] text-fog">
            None
          </div>
        )}
        <label className="cursor-pointer rounded-md border border-line px-4 py-2 text-sm text-muted transition-colors hover:border-fog hover:text-white">
          {uploading ? "Uploading…" : value ? "Replace" : "Choose file"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFile}
            disabled={uploading}
          />
        </label>
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs text-fog underline hover:text-white"
          >
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function StepBasicInfo({ defaultValues, onNext }: StepBasicInfoProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues,
    mode: "onBlur",
  });

  const logoUrl = watch("logoUrl") ?? "";

  return (
    <form onSubmit={handleSubmit(onNext)} className="max-w-2xl space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Name"
          placeholder="Base Marketplace Token"
          error={errors.name?.message}
          {...register("name")}
        />
        <TextField
          label="Symbol"
          placeholder="BMT"
          hint="Uppercase letters and numbers, up to 11 characters"
          error={errors.symbol?.message}
          {...register("symbol", {
            setValueAs: (v: string) => v?.toUpperCase(),
          })}
        />
      </div>

      <TextAreaField
        label="Description"
        placeholder="What this token is for and who it's for."
        rows={4}
        optional
        error={errors.description?.message}
        {...register("description")}
      />

      <LogoUploadField
        value={logoUrl}
        onChange={(url) => setValue("logoUrl", url, { shouldValidate: true })}
      />

      <fieldset className="space-y-6">
        <legend className="text-sm font-medium text-white">Links</legend>
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="Website"
            placeholder="https://"
            optional
            error={errors.website?.message}
            {...register("website")}
          />
          <TextField
            label="Twitter / X"
            placeholder="https://x.com/…"
            optional
            error={errors.twitter?.message}
            {...register("twitter")}
          />
          <TextField
            label="Telegram"
            placeholder="https://t.me/…"
            optional
            error={errors.telegram?.message}
            {...register("telegram")}
          />
          <TextField
            label="Discord"
            placeholder="https://discord.gg/…"
            optional
            error={errors.discord?.message}
            {...register("discord")}
          />
        </div>
      </fieldset>

      <StepFooter continueLabel="Continue to supply" />
    </form>
  );
}
