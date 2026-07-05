import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOwnedTokens } from "@/lib/tokens";

type OwnedToken = Awaited<ReturnType<typeof getOwnedTokens>>[number];

export default async function MyTokensPage() {
  const session = await auth();

  if (!session?.address) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl text-white">My tokens</h1>
        <p className="text-sm text-muted">
          Connect and sign in with your wallet (top right) to see your tokens.
        </p>
      </div>
    );
  }

  const tokens = await getOwnedTokens();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">My tokens</h1>
          <p className="mt-1 text-sm text-muted">
            Tokens owned by {session.address.slice(0, 6)}…{session.address.slice(-4)}
          </p>
        </div>
        <Link
          href="/dashboard/create"
          className="rounded-md bg-base px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-baseDim"
        >
          Create token
        </Link>
      </div>

      {tokens.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
          <p className="text-sm text-muted">No tokens yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {tokens.map((token: OwnedToken) => (
            <li key={token.id}>
              <Link
                href={`/dashboard/tokens/${token.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {token.name}{" "}
                    <span className="font-mono text-fog">${token.symbol}</span>
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-fog">
                    {token.variant} · {token.initialSupply} initial supply
                  </p>
                </div>
                <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-fog">
                  {token.contractAddress.startsWith("pending-")
                    ? "Draft"
                    : "Deployed"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
