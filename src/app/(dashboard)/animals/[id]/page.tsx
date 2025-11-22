import { AnimalDetailClient } from "@/components/animals/AnimalDetailClient";

export const dynamic = "force-dynamic";

export default async function AnimalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnimalDetailClient animalId={id} />;
}

