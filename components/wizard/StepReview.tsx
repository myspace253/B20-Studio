"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { keccak256, toHex } from "viem";
import type { CreateTokenDraft } from "@/types/token";
import type { DeployNetwork } from "@/lib/store/tokenDraft";
import { useB20Transaction } from "@/hooks/useB20Transaction";
import {
  b20FactoryAbi,
  activationRegistryAbi,
  B20_FACTORY_ADDRESS,
  ACTIVATION_REGISTRY_ADDRESS,
  ACTIVATION_FEATURE_ID,
  B20_VARIANT,
} from "@/contracts/b20";
import {
  encodeAssetCreateParams,
  encodeStablecoinCreateParams,
  buildInitCallsFromRoles,
} from "@/lib/b20-encoding";

export interface DeployedResult {
  contractAddress: `0x${string}`;
  txHash: `0x${string}`;
  gasUsed: string;
  effectiveGasPriceGwei: string;
  totalCostEth: string;
  network: DeployNetwork;
}

interface StepReviewProps {
  draft: CreateTokenDraft;
  network: DeployNetwork;
  onNetworkChange: (network: DeployNetwork) => void;
  onBack: () => void;
  onDeployed: (result: DeployedResult) => Promise<void>;
}

const CHAIN_BY_NETWORK = {
  "base-mainnet": base,
  "base-sepolia": baseSepolia,
} as const;

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 text-sm">
      <span className="text-fog">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

export function StepReview({
  draft,
  network,
  onNetworkChange,
  onBack,
  onDeployed,
}: StepReviewProps) {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { send, status } = useB20Transaction();
  const [stepError, setStepError] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    | "idle"
    | "switching-network"
    | "checking-activation"
    | "awaiting-signature"
    | "confirming"
    | "persisting"
  >("idle");

  const targetChain = CHAIN_BY_NETWORK[network];
  const busy = phase !== "idle";

  const handleDeploy = async () => {
    setStepError(null);

    if (!address) {
      setStepError("Connect your wallet first.");
      return;
    }

    try {
      if (chainId !== targetChain.id) {
        setPhase("switching-network");
        await switchChainAsync({ chainId: targetChain.id });
      }

      if (!publicClient) throw new Error("No RPC client available.");

      // Confirm the feature is actually activated before asking for a
      // signature. Base delayed B20's mainnet activation after Beryl
      // shipped, so this can legitimately return false on mainnet even
      // though Sepolia and Vibenet are live — check rather than assume.
      setPhase("checking-activation");
      const featureId =
        draft.supply.variant === "stablecoin"
          ? ACTIVATION_FEATURE_ID.stablecoin
          : ACTIVATION_FEATURE_ID.asset;
      const isActive = await publicClient.readContract({
        address: ACTIVATION_REGISTRY_ADDRESS,
        abi: activationRegistryAbi,
        functionName: "isActivated",
        args: [featureId],
      });

      if (!isActive) {
        setPhase("idle");
        setStepError(
          network === "base-mainnet"
            ? "B20 isn't activated on Base Mainnet yet — activation was delayed after a stability incident. Deploy to Base Sepolia instead."
            : "B20 isn't activated on this network yet."
        );
        return;
      }

      const variant =
        draft.supply.variant === "stablecoin"
          ? B20_VARIANT.stablecoin
          : B20_VARIANT.asset;

      // Fresh salt per attempt — createB20's address is deterministic on
      // (variant, sender, salt), so reusing a salt after a prior success
      // reverts with TokenAlreadyExists.
      const salt = keccak256(
        toHex(
          `${draft.basicInfo.symbol}-${address}-${Date.now()}-${Math.random()}`
        )
      );

      const params =
        draft.supply.variant === "stablecoin"
          ? encodeStablecoinCreateParams(
              draft.basicInfo.name,
              draft.basicInfo.symbol,
              address,
              draft.supply.currency ?? ""
            )
          : encodeAssetCreateParams(
              draft.basicInfo.name,
              draft.basicInfo.symbol,
              address,
              draft.supply.decimals
            );

      const initCalls = buildInitCallsFromRoles(
        draft.roles,
        draft.supply.maximumSupply
      );

      // Predict the deterministic address before sending, rather than
      // parsing it back out of the receipt's event logs afterward.
      const predictedAddress = await publicClient.readContract({
        address: B20_FACTORY_ADDRESS,
        abi: b20FactoryAbi,
        functionName: "getB20Address",
        args: [variant, address, salt],
      });

      setPhase("awaiting-signature");
      const result = await send({
        address: B20_FACTORY_ADDRESS,
        abi: b20FactoryAbi,
        functionName: "createB20",
        args: [variant, salt, params, initCalls],
        chainId: targetChain.id,
      });
      setPhase("confirming");

      setPhase("persisting");
      await onDeployed({
        contractAddress: predictedAddress,
        txHash: result.txHash,
        gasUsed: result.gasUsed.toString(),
        effectiveGasPriceGwei: result.effectiveGasPriceGwei,
        totalCostEth: result.totalCostEth,
        network,
      });
      setPhase("idle");
    } catch (err) {
      setPhase("idle");
      setStepError(err instanceof Error ? err.message : "Deployment failed.");
    }
  };

  const phaseLabel: Record<typeof phase, string> = {
    idle: "Deploy token",
    "switching-network": "Switching network…",
    "checking-activation": "Checking B20 is active…",
    "awaiting-signature": "Confirm in your wallet…",
    confirming: "Confirming on-chain…",
    persisting: "Saving…",
  };

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Token</h2>
        <Row label="Name" value={draft.basicInfo.name} />
        <Row label="Symbol" value={draft.basicInfo.symbol} />
        <Row label="Variant" value={draft.supply.variant} />
        {draft.supply.currency && (
          <Row label="Currency" value={draft.supply.currency} />
        )}
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
        {draft.roles.some((r) => r.role === "transfer") && (
          <p className="mt-2 text-xs text-fog">
            B20 doesn&apos;t have a &quot;transfer&quot; role — transfer
            restriction is a PolicyRegistry assignment instead. This role
            won&apos;t be granted on-chain.
          </p>
        )}
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

      <section>
        <h2 className="mb-2 text-sm font-medium text-white">Network</h2>
        <div className="max-w-xs">
          <select
            value={network}
            onChange={(e) => onNetworkChange(e.target.value as DeployNetwork)}
            disabled={busy}
            className="mt-2 w-full rounded-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-white focus:border-base focus:outline-none"
          >
            <option value="base-sepolia">Base Sepolia (testnet)</option>
            <option value="base-mainnet">Base Mainnet</option>
          </select>
        </div>
        {network === "base-mainnet" && (
          <p className="mt-2 text-xs text-danger">
            This is a real transaction using real ETH for gas. Test on
            Sepolia first.
          </p>
        )}
      </section>

      {status === "success" && (
        <section className="rounded-md border border-signal/40 bg-surface px-4 py-3">
          <p className="text-xs text-signal">Confirmed on-chain.</p>
        </section>
      )}

      {!isConnected && (
        <p className="rounded-md border border-line bg-surface px-4 py-3 text-sm text-signal">
          Connect a wallet to deploy — use the button in the top bar.
        </p>
      )}

      {stepError && <p className="text-sm text-danger">{stepError}</p>}

      <div className="flex items-center justify-between border-t border-line pt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="rounded-md border border-line px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white disabled:opacity-60"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleDeploy}
          disabled={busy || !isConnected}
          className="rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phaseLabel[phase]}
        </button>
      </div>
    </div>
  );
}
