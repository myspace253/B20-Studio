export default function TokenAnalyticsPage() {
  return (
    <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
      <p className="text-sm text-muted">
        Holder growth, transfer volume, and top wallets need an indexer
        reading this token&apos;s transfer events on-chain.
      </p>
      <p className="mt-2 text-xs text-fog">
        Not available until the token is deployed and an indexing service
        (e.g. a subgraph or a Base RPC log-scanning job) is wired in.
      </p>
    </div>
  );
}
