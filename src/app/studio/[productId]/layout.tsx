import type { Metadata } from "next";
import { getProductById } from "@/application/product-service";

interface Props {
  params: Promise<{ productId: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductById(productId);

  if (!product) {
    return { title: "스튜디오 | RunHouse Custom" };
  }

  return {
    title: `${product.name} 커스터마이징 | RunHouse Custom`,
    description: product.description || `${product.name}을 나만의 스타일로 커스터마이징하세요.`,
    openGraph: {
      title: `${product.name} 커스터마이징 | RunHouse Custom`,
      description: product.description || `${product.name}을 나만의 스타일로 커스터마이징하세요.`,
      images: product.images?.[0]?.url ? [product.images[0].url] : [],
    },
  };
}

export default function StudioLayout({ children }: Props) {
  return children;
}
