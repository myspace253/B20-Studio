import { getOwnedToken } from "@/lib/tokens";
import { TransferRuleForm } from "@/components/dashboard/TransferRuleForm";

export default async function TransferRulesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  return <TransferRuleForm initial={token.transferRule} />;
}
