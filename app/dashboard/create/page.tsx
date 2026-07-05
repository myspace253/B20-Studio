"use client";

import { useRouter } from "next/navigation";
import { WizardShell } from "@/components/wizard/WizardShell";
import { StepBasicInfo } from "@/components/wizard/StepBasicInfo";
import { StepSupply } from "@/components/wizard/StepSupply";
import { StepPermissions } from "@/components/wizard/StepPermissions";
import { StepTransferRules } from "@/components/wizard/StepTransferRules";
import { StepTokenomics } from "@/components/wizard/StepTokenomics";
import { StepReview } from "@/components/wizard/StepReview";
import { useTokenDraftStore } from "@/lib/store/tokenDraft";
import type { BasicInfoFormValues } from "@/lib/schemas/basicInfo";
import type { SupplyFormValues } from "@/lib/schemas/supply";
import type { RolesFormValues } from "@/lib/schemas/roles";
import type { TransferRulesFormValues } from "@/lib/schemas/transferRules";
import type { TokenomicsFormValues } from "@/lib/schemas/tokenomics";
import type { CreateTokenDraft, TokenRoleAssignment } from "@/types/token";

function rolesFormToAssignments(values: RolesFormValues): TokenRoleAssignment[] {
  const map: [TokenRoleAssignment["role"], string | undefined][] = [
    ["owner", values.owner],
    ["admin", values.admin],
    ["mint", values.mintRole],
    ["burn", values.burnRole],
    ["freeze", values.freezeRole],
    ["transfer", values.transferRole],
  ];
  return map
    .filter(([, address]) => !!address)
    .map(([role, address]) => ({ role, address: address as string }));
}

export default function CreateTokenPage() {
  const router = useRouter();
  const draft = useTokenDraftStore();

  const handleBasicInfo = (values: BasicInfoFormValues) => {
    draft.setBasicInfo({
      name: values.name,
      symbol: values.symbol,
      description: values.description || "",
      website: values.website,
      twitter: values.twitter,
      telegram: values.telegram,
      discord: values.discord,
    });
    draft.setStep(1);
  };

  const handleSupply = (values: SupplyFormValues) => {
    draft.setSupply({
      variant: values.variant,
      initialSupply: values.initialSupply,
      maximumSupply: values.maximumSupply || undefined,
      decimals: values.decimals,
      mintable: values.mintable,
      burnable: values.burnable,
      pausable: values.pausable,
    });
    draft.setStep(2);
  };

  const handleRoles = (values: RolesFormValues) => {
    draft.setRoles(rolesFormToAssignments(values));
    draft.setStep(3);
  };

  const handleTransferRules = (values: TransferRulesFormValues) => {
    draft.setTransferRules(values);
    draft.setStep(4);
  };

  const handleTokenomics = (values: TokenomicsFormValues) => {
    draft.setTokenomics(values);
    draft.setStep(5);
  };

  const handleDeploy = async () => {
    if (
      !draft.basicInfo ||
      !draft.supply ||
      !draft.transferRules ||
      !draft.tokenomics
    ) {
      throw new Error("Draft is incomplete — go back and fill in every step.");
    }

    const payload: CreateTokenDraft = {
      basicInfo: draft.basicInfo,
      supply: draft.supply,
      roles: draft.roles,
      transferRules: draft.transferRules,
      tokenomics: draft.tokenomics,
    };

    const res = await fetch("/api/create-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error || "Deployment request failed");
    }

    draft.reset();
    router.push("/dashboard");
  };

  return (
    <WizardShell currentStep={draft.step}>
      {draft.step === 0 && (
        <StepBasicInfo
          defaultValues={draft.basicInfo ?? undefined}
          onNext={handleBasicInfo}
        />
      )}
      {draft.step === 1 && (
        <StepSupply
          defaultValues={draft.supply ?? undefined}
          onNext={handleSupply}
          onBack={() => draft.setStep(0)}
        />
      )}
      {draft.step === 2 && (
        <StepPermissions onNext={handleRoles} onBack={() => draft.setStep(1)} />
      )}
      {draft.step === 3 && (
        <StepTransferRules
          defaultValues={draft.transferRules ?? undefined}
          onNext={handleTransferRules}
          onBack={() => draft.setStep(2)}
        />
      )}
      {draft.step === 4 && (
        <StepTokenomics
          defaultValues={draft.tokenomics ?? undefined}
          onNext={handleTokenomics}
          onBack={() => draft.setStep(3)}
        />
      )}
      {draft.step === 5 &&
        draft.basicInfo &&
        draft.supply &&
        draft.transferRules &&
        draft.tokenomics && (
          <StepReview
            draft={{
              basicInfo: draft.basicInfo,
              supply: draft.supply,
              roles: draft.roles,
              transferRules: draft.transferRules,
              tokenomics: draft.tokenomics,
            }}
            onBack={() => draft.setStep(4)}
            onDeploy={handleDeploy}
          />
        )}
    </WizardShell>
  );
}
