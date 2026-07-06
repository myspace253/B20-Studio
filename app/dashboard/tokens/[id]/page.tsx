import { getOwnedToken } from "@/lib/tokens";
import { formatTokenAmount } from "@/utils/format";
import { explorerAddressUrl, explorerTxUrl } from "@/lib/explorer";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface px-5 py-4">
      <p className="font-mono text-xs uppercase tracking-wide text-fog">
        {label}
      </p>
      <p className="mt-1 font-display text-xl text-white">{value}</p>
    </div>
  );
}

export default async function TokenOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Network" value={token.network} />
        <StatCard
          label="Initial supply"
          value={formatTokenAmount(token.initialSupply, token.decimals)}
        />
        <StatCard
          label="Max supply"
          value={
            token.maximumSupply
              ? formatTokenAmount(token.maximumSupply, token.decimals)
              : "Uncapped"
          }
        />
        {/* Holders/volume need an indexer reading transfer events on-chain —
            not real until the token is actually deployed and indexed, so
            these are honest placeholders rather than fabricated numbers. */}
        <StatCard label="Holders" value="—" />
        <StatCard label="24h volume" value="—" />
      </div>

      <div className="rounded-md border border-line bg-surface px-5 py-4">
        <p className="font-mono text-xs uppercase tracking-wide text-fog">
          Status
        </p>
        {token.contractAddress.startsWith("pending-") ? (
          <p className="mt-1 text-sm text-white">
            Draft — not yet deployed on-chain.
          </p>
        ) : (
          <div className="mt-1 space-y-1.5 text-sm">
            <p>
              <a
                href={explorerAddressUrl(
                  token.network as "base-mainnet" | "base-sepolia",
                  token.contractAddress
                )}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-base hover:underline"
              >
                {token.contractAddress}
              </a>
              <span className="ml-2 text-xs text-fog">View on Basescan ↗</span>
            </p>
            {token.deployments[0] && (
              <p>
                <a
                  href={explorerTxUrl(
                    token.network as "base-mainnet" | "base-sepolia",
                    token.deployments[0].txHash
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-xs text-muted hover:underline"
                >
                  {token.deployments[0].txHash}
                </a>
                <span className="ml-2 text-xs text-fog">Deploy transaction ↗</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
