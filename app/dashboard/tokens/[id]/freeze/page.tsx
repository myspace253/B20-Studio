import { getOwnedToken } from "@/lib/tokens";
import { FreezeManager } from "@/components/dashboard/FreezeManager";

type OwnedToken = NonNullable<Awaited<ReturnType<typeof getOwnedToken>>>;

export default async function FreezePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  const freezeRoleConfigured = token.roles.some(
    (r: OwnedToken["roles"][number]) => r.role === "freeze"
  );

  return (
    <FreezeManager
      initialFrozen={token.frozenAddresses}
      freezeRoleConfigured={freezeRoleConfigured}
    />
  );
}
