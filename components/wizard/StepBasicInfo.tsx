"use client";

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

export function StepBasicInfo({ defaultValues, onNext }: StepBasicInfoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues,
    mode: "onBlur",
  });

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
