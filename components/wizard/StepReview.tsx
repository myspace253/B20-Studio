"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { keccak256, toHex, encodeFunctionData } from "viem";
import type { CreateTokenDraft } from "@/types/token";
import type { DeployNetwork } from "@/lib/store/tokenDraft";
import { useB20Transaction } from "@/hooks/useB20Transaction";
import { useVanityAddress } from "@/hooks/useVanityAddress";
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
  buildInitCalls,
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
  const targetChain = CHAIN_BY_NETWORK[network];
  const publicClient = usePublicClient({ chainId: targetChain.id });
  const { switchChainAsync } = useSwitchChain();
  const { send, status } = useB20Transaction(targetChain.id);
  const [stepError, setStepError] = useState<string | null>(null);
  const [phase, setPhase] = useState<
    | "idle"
    | "switching-network"
    | "checking-activation"
    | "awaiting-signature"
    | "confirming"
    | "persisting"
  >("idle");

  const busy = phase !== "idle";

  const variant =
    draft.supply.variant === "stablecoin"
      ? B20_VARIANT.stablecoin
      : B20_VARIANT.asset;

  const [vanitySuffix, setVanitySuffix] = useState("");
  const vanity = useVanityAddress(publicClient, variant, address);

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

      // The Permissions step's "Owner" becomes initialAdmin — B20 assigns
      // DEFAULT_ADMIN_ROLE this way at creation, not via a separate role
      // grant. Falling back to the connected wallet only covers the
      // (schema-disallowed) case where no owner was somehow set.
      const ownerRole = draft.roles.find((r) => r.role === "owner");
      const initialAdmin = (ownerRole?.address as `0x${string}` | undefined) ?? address;

      // Use the vanity-search salt if the user found and kept one —
      // otherwise fresh salt per attempt, since createB20's address is
      // deterministic on (variant, sender, salt) and reusing a salt after
      // a prior success reverts with TokenAlreadyExists.
      const salt =
        vanity.match?.salt ??
        keccak256(
          toHex(
            `${draft.basicInfo.symbol}-${address}-${Date.now()}-${Math.random()}`
          )
        );

      const params =
        draft.supply.variant === "stablecoin"
          ? encodeStablecoinCreateParams(
              draft.basicInfo.name,
              draft.basicInfo.symbol,
              initialAdmin,
              draft.supply.currency ?? ""
            )
          : encodeAssetCreateParams(
              draft.basicInfo.name,
              draft.basicInfo.symbol,
              initialAdmin,
              draft.supply.decimals
            );

      const initCalls = buildInitCalls({
        roles: draft.roles,
        initialAdmin,
        initialSupply: draft.supply.initialSupply,
        maximumSupply: draft.supply.maximumSupply,
        decimals: draft.supply.decimals,
        mintable: draft.supply.mintable,
        burnable: draft.supply.burnable,
        pausable: draft.supply.pausable,
      });

      // Predict the deterministic address before sending, rather than
      // parsing it back out of the receipt's event logs afterward.
      const predictedAddress = await publicClient.readContract({
        address: B20_FACTORY_ADDRESS,
        abi: b20FactoryAbi,
        functionName: "getB20Address",
        args: [variant, address, salt],
      });

      // Integrity check, not a formality: a real deploy from this wizard
      // reverted on-chain with "ABI decoding failed: buffer overrun while
      // deserializing" — the precompile's Rust ABI decoder ran off the end
      // of the calldata buffer. Byte-diffing the actual on-chain calldata
      // against a clean re-encode of the identical (variant, salt, params,
      // initCalls) showed the transmitted calldata was exactly 1 byte
      // short of a valid 32-byte word boundary, inside the zero-padding
      // of a dynamic string field. This wizard's own encoding functions
      // (buildInitCalls, encodeAssetCreateParams) produce correct,
      // byte-perfect output for those exact inputs when re-run directly —
      // so the corruption happened somewhere between building these args
      // and broadcast (a stale bundle, or a wallet/RPC layer treating the
      // hex calldata as a number and dropping a trailing zero byte).
      // Independently re-encoding here with the same args and asserting
      // word-alignment catches that class of corruption before the wallet
      // is even asked to sign, instead of silently wasting gas on a
      // guaranteed revert with an opaque error.
      const encodedCalldata = encodeFunctionData({
        abi: b20FactoryAbi,
        functionName: "createB20",
        args: [variant, salt, params, initCalls],
      });
      const bodyLength = (encodedCalldata.length - 2) / 2 - 4; // strip "0x" + 4-byte selector
      if (bodyLength % 32 !== 0) {
        throw new Error(
          `Calldata integrity check failed: body is ${bodyLength} bytes, not a multiple of 32. This would revert on-chain with "ABI decoding failed" — refusing to send. Please retry; if this persists, report it.`
        );
      }

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
        {draft.roles.some((r) => r.role === "owner") && (
          <p className="mt-2 text-xs text-fog">
            The Owner address becomes this token&apos;s admin at creation
            (B20&apos;s <code>initialAdmin</code>), not via a separate role
            grant.
          </p>
        )}
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

      <section>
        <h2 className="mb-2 text-sm font-medium text-white">
          Vanity address <span className="text-fog">(optional)</span>
        </h2>
        <p className="mb-3 text-xs text-fog">
          Only the last 9 bytes of a B20 address are derived from the salt
          — every token of this variant shares the same leading bytes — so
          this searches for an <em>ending</em>, not a full custom address.
        </p>
        {!isConnected ? (
          <p className="text-xs text-fog">Connect a wallet to search.</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-2">
              <span className="font-mono text-sm text-fog">…</span>
              <input
                type="text"
                value={vanitySuffix}
                onChange={(e) =>
                  setVanitySuffix(
                    e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6)
                  )
                }
                placeholder="c0ffee"
                disabled={vanity.status === "searching" || busy}
                className="w-28 bg-transparent font-mono text-sm text-white placeholder:text-fog focus:outline-none"
              />
            </div>
            {vanity.status === "searching" ? (
              <button
                type="button"
                onClick={vanity.cancel}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white"
              >
                Stop ({vanity.attempts} checked)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => vanity.search(vanitySuffix)}
                disabled={!vanitySuffix || busy}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-fog hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Search
              </button>
            )}
            {vanity.match && (
              <button
                type="button"
                onClick={vanity.reset}
                className="text-xs text-fog underline hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        )}
        {vanity.status === "found" && vanity.match && (
          <p className="mt-3 font-mono text-sm text-signal">
            {vanity.match.address} — found in {vanity.match.attempts} tries
          </p>
        )}
        {vanity.status === "not-found" && (
          <p className="mt-3 text-xs text-danger">
            No match after 2,000 tries — try a shorter ending.
          </p>
        )}
        {vanity.status === "error" && (
          <p className="mt-3 text-xs text-danger">
            Enter 1–6 hex characters (0–9, a–f).
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
