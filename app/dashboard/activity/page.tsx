import { auth } from "@/lib/auth";
import { getOwnedTransactions } from "@/lib/tokens";
import { truncateAddress } from "@/utils/format";

type OwnedTransaction = Awaited<ReturnType<typeof getOwnedTransactions>>[number];

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.address) {
    return (
      <div className="space-y-2">
        <h1 className="font-display text-2xl text-white">Transaction history</h1>
        <p className="text-sm text-muted">Sign in with your wallet to see this.</p>
      </div>
    );
  }

  const transactions = await getOwnedTransactions();

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl text-white">Transaction history</h1>

      {transactions.length === 0 ? (
        <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
          <p className="text-sm text-muted">No transactions yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line">
          {transactions.map((tx: OwnedTransaction) => (
            <li key={tx.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span className="text-white">
                {tx.type} <span className="font-mono text-fog">${tx.token.symbol}</span>
              </span>
              <span className="font-mono text-xs text-fog">
                {tx.from && truncateAddress(tx.from)} {tx.to && `→ ${truncateAddress(tx.to)}`}
              </span>
              <span className="font-mono text-xs text-fog">
                {tx.createdAt.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
