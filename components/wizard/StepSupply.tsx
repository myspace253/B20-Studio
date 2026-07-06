"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supplySchema, type SupplyFormValues } from "@/lib/schemas/supply";
import { TextField } from "@/components/ui/TextField";
import { Checkbox, SelectField } from "@/components/ui/FormControls";
import { StepFooter } from "@/components/wizard/StepFooter";

interface StepSupplyProps {
  defaultValues?: Partial<SupplyFormValues>;
  onNext: (values: SupplyFormValues) => void;
  onBack: () => void;
}

export function StepSupply({ defaultValues, onNext, onBack }: StepSupplyProps) {
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors },
  } = useForm<SupplyFormValues>({
    resolver: zodResolver(supplySchema),
    defaultValues: {
      variant: "asset",
      decimals: 18,
      mintable: true,
      burnable: true,
      pausable: false,
      currency: "",
      ...defaultValues,
    },
  });

  const variant = watch("variant");

  return (
    <form onSubmit={handleSubmit(onNext)} className="max-w-2xl space-y-8">
      <Controller
        name="variant"
        control={control}
        render={({ field }) => (
          <SelectField
            label="Variant"
            options={[
              { value: "asset", label: "Asset — general-purpose, configurable decimals" },
              { value: "stablecoin", label: "Stablecoin — fixed 6 decimals, currency code" },
            ]}
            value={field.value}
            onChange={(e) => {
              field.onChange(e.target.value);
              if (e.target.value === "stablecoin") setValue("decimals", 6);
            }}
          />
        )}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Initial supply"
          placeholder="1000000000"
          hint="Whole units, no decimal point"
          error={errors.initialSupply?.message}
          {...register("initialSupply")}
        />
        <TextField
          label="Maximum supply"
          placeholder="Leave blank for uncapped"
          optional
          error={errors.maximumSupply?.message}
          {...register("maximumSupply")}
        />
        <TextField
          label="Decimals"
          type="number"
          disabled={variant === "stablecoin"}
          hint={
            variant === "stablecoin"
              ? "Fixed at 6 for the stablecoin variant"
              : "Between 6 and 18 — enforced on-chain"
          }
          error={errors.decimals?.message}
          {...register("decimals")}
        />
        {variant === "stablecoin" && (
          <TextField
            label="Currency code"
            placeholder="USD"
            hint="Uppercase, immutable after creation"
            error={errors.currency?.message}
            {...register("currency", {
              setValueAs: (v: string) => v?.toUpperCase(),
            })}
          />
        )}
      </div>

      <fieldset className="space-y-4">
        <legend className="text-sm font-medium text-white">Capabilities</legend>
        <Checkbox
          label="Mintable"
          hint="Issuer can mint new supply after launch"
          {...register("mintable")}
        />
        <Checkbox
          label="Burnable"
          hint="Holders or the burn role can destroy tokens"
          {...register("burnable")}
        />
        <Checkbox
          label="Pausable"
          hint="Issuer can freeze all transfers in an emergency"
          {...register("pausable")}
        />
      </fieldset>

      <StepFooter onBack={onBack} continueLabel="Continue to permissions" />
    </form>
  );
}
