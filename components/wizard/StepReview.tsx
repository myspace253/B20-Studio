"use client";

import { useState } from "react";
import type { CreateTokenDraft } from "@/types/token";
import { useRequireWallet } from "@/hooks/useRequireWallet";

interface StepReviewProps {
  draft: CreateTokenDraft;
  onBack: () => void;
  onDeploy: () => Promise<void>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 text-sm">
      <span className="text-fog">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

export function StepReview({ draft, onBack, onDeploy }: StepReviewProps) {
  const { isConnected } = useRequireWallet();
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    try {
      await onDeploy();
    } catch (err) {
      setDeployError(
        err instanceof Error ? err.message : "Deployment failed. Try again."
      );
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Token</h2>
        <Row label="Name" value={draft.basicInfo.name} />
        <Row label="Symbol" value={draft.basicInfo.symbol} />
        <Row label="Variant" value={draft.supply.variant} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Supply</h2>
        <Row label="Initial supply" value={draft.supply.initialSupply} />
        <Row
          label="Maximum supply"
          value={draft.supply.maximumSupply || "Uncapped"}
        />
        <Row label="Decimals" value={draft.supply.decimals} />
        <Row
          label="Capabilities"
          value={
            [
              draft.supply.mintable && "Mintable",
              draft.supply.burnable && "Burnable",
              draft.supply.pausable && "Pausable",
            ]
              .filter(Boolean)
              .join(", ") || "None"
          }
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Roles</h2>
        {draft.roles.map((r) => (
          <Row key={r.role} label={r.role} value={r.address} />
        ))}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Transfer rules</h2>
        <Row label="Type" value={draft.transferRules.type} />
        {draft.transferRules.value && (
          <Row label="Value" value={draft.transferRules.value} />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Tokenomics</h2>
        <Row label="Treasury" value={`${draft.tokenomics.treasury}%`} />
        <Row label="Team" value={`${draft.tokenomics.team}%`} />
        <Row label="Community" value={`${draft.tokenomics.community}%`} />
        <Row label="Liquidity" value={`${draft.tokenomics.liquidity}%`} />
        <Row label="Airdrop" value={`${draft.tokenomics.airdrop}%`} />
        <Row label="Reserve" value={`${draft.tokenomics.reserve}%`} />
      </section>

      <section className="rounded-md border border-line bg-surface px-4 py-3">
        <p className="text-xs text-fog">
          Estimated gas isn&apos;t shown yet — it depends on the Base B20 SDK
          call this token deploys through, which isn&apos;t wired in yet. See{" "}
          <code className="text-muted">services/b20.ts</code>.
        </p>
      </section>

      {!isConnected && (
        <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-signal">
          Connect a wallet to deploy — use the button in the top bar.
        </p>
      )}

      {deployError && <p className="text-sm text-danger">{deployError}</p>}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleDeploy}
          disabled={deploying || !isConnected}
          className="rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deploying ? "Deploying…" : "Deploy token"}
        </button>
      </div>
    </div>
  );
}
