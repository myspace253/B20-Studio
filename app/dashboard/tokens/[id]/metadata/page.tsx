import { getOwnedToken } from "@/lib/tokens";
import { MetadataForm } from "@/components/dashboard/MetadataForm";

export default async function MetadataPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getOwnedToken(id);
  if (!token) return null; // layout already calls notFound()

  return <MetadataForm initial={token.metadata ?? {}} />;
}
