import { getOwnedTokens } from "@/lib/tokens";

type OwnedToken = Awaited<ReturnType<typeof getOwnedTokens>>[number];

export default async function AnalyticsPage() {
  const tokens = await getOwnedTokens();
  const deployed = tokens.filter(
    (t: OwnedToken) => !t.contractAddress.startsWith("pending-")
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-white">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Across all of your tokens.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-surface px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-wide text-fog">
            Total tokens
          </p>
          <p className="mt-1 font-display text-xl text-white">{tokens.length}</p>
        </div>
        <div className="rounded-md border border-line bg-surface px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-wide text-fog">
            Deployed
          </p>
          <p className="mt-1 font-display text-xl text-white">{deployed.length}</p>
        </div>
        <div className="rounded-md border border-line bg-surface px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-wide text-fog">
            Drafts
          </p>
          <p className="mt-1 font-display text-xl text-white">
            {tokens.length - deployed.length}
          </p>
        </div>
      </div>

      <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
        <p className="text-sm text-muted">
          Volume and holder charts require an on-chain indexer per deployed
          token — see each token&apos;s Analytics tab.
        </p>
      </div>
    </div>
  );
}
