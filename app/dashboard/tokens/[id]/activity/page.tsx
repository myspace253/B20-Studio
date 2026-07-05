import { prisma } from "@/lib/prisma";
import { truncateAddress } from "@/utils/format";

export default async function TokenActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const transactions = await prisma.transaction.findMany({
    where: { tokenId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  type TokenTransaction = (typeof transactions)[number];

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
        <p className="text-sm text-muted">No activity yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line rounded-md border border-line">
      {transactions.map((tx: TokenTransaction) => (
        <li key={tx.id} className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-white">{tx.type}</span>
          <span className="font-mono text-xs text-fog">
            {tx.from && truncateAddress(tx.from)} {tx.to && `→ ${truncateAddress(tx.to)}`}
          </span>
          <span className="font-mono text-xs text-fog">
            {tx.createdAt.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
