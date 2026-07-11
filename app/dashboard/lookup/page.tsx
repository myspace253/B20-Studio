"use client";

import { useState } from "react";
import { createPublicClient, http, isAddress } from "viem";
import { base, baseSepolia } from "viem/chains";
import { useAccount } from "wagmi";
import { TextField } from "@/components/ui/TextField";
import { SelectField } from "@/components/ui/FormControls";
import {
  B20_FACTORY_ADDRESS,
  b20FactoryAbi,
  b20TokenAbi,
  B20_ROLE,
} from "@/contracts/b20";
import { explorerAddressUrl } from "@/lib/explorer";

const CHAIN_BY_NETWORK = { "base-mainnet": base, "base-sepolia": baseSepolia } as const;
type Network = keyof typeof CHAIN_BY_NETWORK;

const ROLE_LABELS: { label: string; role: `0x${string}` }[] = [
  { label: "Default admin", role: B20_ROLE.DEFAULT_ADMIN_ROLE },
  { label: "Mint", role: B20_ROLE.MINT_ROLE },
  { label: "Burn", role: B20_ROLE.BURN_ROLE },
  { label: "Burn blocked (freeze)", role: B20_ROLE.BURN_BLOCKED_ROLE },
  { label: "Pause", role: B20_ROLE.PAUSE_ROLE },
  { label: "Unpause", role: B20_ROLE.UNPAUSE_ROLE },
  { label: "Metadata", role: B20_ROLE.METADATA_ROLE },
  { label: "Operator", role: B20_ROLE.OPERATOR_ROLE },
];

interface LookupResult {
  isB20: boolean;
  isInitialized: boolean;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: bigint;
  roles?: { label: string; held: boolean }[];
}

export default function LookupPage() {
  const { address: connectedAddress } = useAccount();
  const [network, setNetwork] = useState<Network>("base-sepolia");
  const [tokenAddress, setTokenAddress] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!isAddress(tokenAddress)) {
      setError("Enter a valid address.");
      return;
    }

    setStatus("loading");
    try {
      const client = createPublicClient({
        chain: CHAIN_BY_NETWORK[network],
        transport: http(),
      });

      // isB20 is derivable from the address's own prefix bytes and can
      // return true even for an address that was never actually created —
      // isB20Initialized is the one that confirms a real, live token.
      const [isB20, isInitialized] = await Promise.all([
        client.readContract({
          address: B20_FACTORY_ADDRESS,
          abi: b20FactoryAbi,
          functionName: "isB20",
          args: [tokenAddress],
        }),
        client.readContract({
          address: B20_FACTORY_ADDRESS,
          abi: b20FactoryAbi,
          functionName: "isB20Initialized",
          args: [tokenAddress],
        }),
      ]);

      if (!isInitialized) {
        setResult({ isB20, isInitialized });
        setStatus("done");
        return;
      }

      const [name, symbol, decimals, totalSupply] = await Promise.all([
        client.readContract({
          address: tokenAddress,
          abi: b20TokenAbi,
          functionName: "name",
        }),
        client.readContract({
          address: tokenAddress,
          abi: b20TokenAbi,
          functionName: "symbol",
        }),
        client.readContract({
          address: tokenAddress,
          abi: b20TokenAbi,
          functionName: "decimals",
        }),
        client.readContract({
          address: tokenAddress,
          abi: b20TokenAbi,
          functionName: "totalSupply",
        }),
      ]);

      // Role holdings are checked against the connected wallet, not the
      // token's admin — this answers "can I do X with this token", which
      // is what matters before preparing a mint/burn/pause transaction.
      let roles: LookupResult["roles"];
      if (connectedAddress) {
        roles = await Promise.all(
          ROLE_LABELS.map(async ({ label, role }) => ({
            label,
            held: (await client.readContract({
              address: tokenAddress,
              abi: b20TokenAbi,
              functionName: "hasRole",
              args: [role, connectedAddress],
            })) as boolean,
          }))
        );
      }

      setResult({ isB20, isInitialized, name, symbol, decimals, totalSupply, roles });
      setStatus("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Lookup failed — check the address and network."
      );
      setStatus("error");
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-white">Look up a token</h1>
        <p className="mt-1 text-sm text-muted">
          Inspect any address on Base — confirm it&apos;s a real, initialized
          B20 token, view its metadata, and check which roles your connected
          wallet holds on it.
        </p>
      </div>

      <form onSubmit={handleLookup} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto]">
          <TextField
            label="Token address"
            placeholder="0x…"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value.trim())}
          />
          <SelectField
            label="Network"
            value={network}
            onChange={(e) => setNetwork(e.target.value as Network)}
            options={[
              { value: "base-sepolia", label: "Base Sepolia" },
              { value: "base-mainnet", label: "Base Mainnet" },
            ]}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !tokenAddress}
          className="rounded-md bg-base px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Looking up…" : "Look up"}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="space-y-4 rounded-md border border-line bg-surface px-5 py-4">
          {!result.isInitialized ? (
            <p className="text-sm text-danger">
              {result.isB20
                ? "This address has the B20 prefix but was never actually initialized through the factory — it is not a real token."
                : "This address is not a B20 token."}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {result.name}{" "}
                    <span className="font-mono text-fog">${result.symbol}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-fog">
                    {result.decimals} decimals · {result.totalSupply?.toString()} total
                    supply (base units)
                  </p>
                </div>
                <a
                  href={explorerAddressUrl(network, tokenAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-base underline"
                >
                  View on explorer ↗
                </a>
              </div>

              {result.roles ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.1em] text-fog">
                    Your roles on this token
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {result.roles.map((r) => (
                      <li
                        key={r.label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted">{r.label}</span>
                        <span className={r.held ? "text-signal" : "text-fog"}>
                          {r.held ? "Granted" : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-fog">
                  Connect a wallet to check which roles you hold on this token.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
