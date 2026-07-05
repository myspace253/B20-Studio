import Link from "next/link";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-white">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Your B20 tokens, at a glance.
        </p>
      </div>

      {/* Empty state — this is the honest state for a fresh account, not a
          placeholder skeleton pretending data exists. */}
      <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
        <p className="text-sm text-muted">No tokens yet.</p>
        <Link
          href="/dashboard/create"
          className="mt-4 inline-block rounded-md bg-base px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim"
        >
          Create your first token
        </Link>
      </div>
    </div>
  );
}
