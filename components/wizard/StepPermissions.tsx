"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rolesSchema, type RolesFormValues } from "@/lib/schemas/roles";
import { TextField } from "@/components/ui/TextField";
import { StepFooter } from "@/components/wizard/StepFooter";

interface StepPermissionsProps {
  defaultValues?: Partial<RolesFormValues>;
  onNext: (values: RolesFormValues) => void;
  onBack: () => void;
}

export function StepPermissions({
  defaultValues,
  onNext,
  onBack,
}: StepPermissionsProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RolesFormValues>({
    resolver: zodResolver(rolesSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="max-w-2xl space-y-6">
      <p className="text-sm text-muted">
        B20 supports a richer role model than plain ERC-20 — each role below
        maps to a permission enforced at the protocol level, not inside a
        contract you have to audit yourself.
      </p>

      <TextField
        label="Owner"
        placeholder="0x…"
        hint="Full control, including reassigning other roles"
        error={errors.owner?.message}
        {...register("owner")}
      />
      <TextField
        label="Admin"
        placeholder="0x…"
        optional
        error={errors.admin?.message}
        {...register("admin")}
      />
      <div className="grid gap-6 md:grid-cols-2">
        <TextField
          label="Mint role"
          placeholder="0x…"
          optional
          error={errors.mintRole?.message}
          {...register("mintRole")}
        />
        <TextField
          label="Burn role"
          placeholder="0x…"
          optional
          error={errors.burnRole?.message}
          {...register("burnRole")}
        />
        <TextField
          label="Freeze role"
          placeholder="0x…"
          optional
          hint="Can freeze or seize assets from blocked addresses"
          error={errors.freezeRole?.message}
          {...register("freezeRole")}
        />
        <TextField
          label="Transfer role"
          placeholder="0x…"
          optional
          error={errors.transferRole?.message}
          {...register("transferRole")}
        />
      </div>

      <StepFooter onBack={onBack} continueLabel="Continue to transfer rules" />
    </form>
  );
}
