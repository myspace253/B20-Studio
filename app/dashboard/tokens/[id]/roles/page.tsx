import { getOwnedToken } from "@/lib/tokens";
import { RolesManager } from "@/components/dashboard/RolesManager";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  return <RolesManager initialRoles={token.roles} />;
}
