import { getOwnedToken } from "@/lib/tokens";
import { TokenInsights } from "@/components/token/TokenInsights";

export default async function TokenOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  return <TokenInsights token={token} />;
}
