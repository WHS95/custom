import { getProductWithAreas } from "@/application/product-service";
import { notFound } from "next/navigation";
import { StudioClient } from "@/components/studio/StudioClient";

interface Props {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export default async function StudioPage({ params, searchParams }: Props) {
  const { productId } = await params;
  const { mode } = await searchParams;
  const product = await getProductWithAreas(productId);

  if (!product) notFound();

  return <StudioClient product={product} mode={mode} />;
}
