import { notFound } from "next/navigation";
import { getOwnedToken } from "@/lib/tokens";
import { TokenTabs } from "@/components/layout/TokenTabs";

export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);

  if (!token) notFound();

  return (
    <div className="space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
          {token.variant}
        </p>
        <h1 className="mt-1 font-display text-2xl text-white">
          {token.name} <span className="text-fog">${token.symbol}</span>
        </h1>
      </div>

      <TokenTabs tokenId={id} />

      {children}
    </div>
  );
}
