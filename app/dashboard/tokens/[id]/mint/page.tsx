import { getOwnedToken } from "@/lib/tokens";
import { MintForm } from "@/components/dashboard/MintForm";

export default async function MintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  if (!token.mintable) {
    return (
      <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
        <p className="text-sm text-muted">
          This token was not configured as mintable.
        </p>
      </div>
    );
  }

  if (token.contractAddress.startsWith("pending-")) {
    return (
      <div className="rounded-md border border-dashed border-line px-8 py-16 text-center">
        <p className="text-sm text-muted">
          This token hasn&apos;t been deployed on-chain yet.
        </p>
      </div>
    );
  }

  return (
    <MintForm
      contractAddress={token.contractAddress as `0x${string}`}
      decimals={token.decimals}
      network={token.network as "base-mainnet" | "base-sepolia"}
    />
  );
}
