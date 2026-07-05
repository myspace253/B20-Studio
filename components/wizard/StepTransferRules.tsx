"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  transferRulesSchema,
  transferRuleTypes,
  type TransferRulesFormValues,
} from "@/lib/schemas/transferRules";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/FormControls";
import { StepFooter } from "@/components/wizard/StepFooter";

interface StepTransferRulesProps {
  defaultValues?: Partial<TransferRulesFormValues>;
  onNext: (values: TransferRulesFormValues) => void;
  onBack: () => void;
}

const VALUE_HINTS: Record<string, string> = {
  max_wallet: "Maximum balance a single wallet can hold (whole units)",
  max_transaction: "Maximum amount per transfer (whole units)",
  country_restrictions: "Comma-separated ISO country codes to block, e.g. US,KP",
};

export function StepTransferRules({
  defaultValues,
  onNext,
  onBack,
}: StepTransferRulesProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TransferRulesFormValues>({
    resolver: zodResolver(transferRulesSchema),
    defaultValues: { type: "allow_everyone", ...defaultValues },
  });

  const type = watch("type");
  const needsValue = ["max_wallet", "max_transaction", "country_restrictions"].includes(
    type
  );

  return (
    <form onSubmit={handleSubmit(onNext)} className="max-w-2xl space-y-6">
      <SelectField
        label="Rule type"
        options={transferRuleTypes.map((t) => ({ value: t.value, label: t.label }))}
        {...register("type")}
      />

      {needsValue && (
        <TextField
          label="Value"
          placeholder={type === "country_restrictions" ? "US,KP" : "1000000"}
          hint={VALUE_HINTS[type]}
          error={errors.value?.message}
          {...register("value")}
        />
      )}

      <StepFooter onBack={onBack} continueLabel="Continue to tokenomics" />
    </form>
  );
}
