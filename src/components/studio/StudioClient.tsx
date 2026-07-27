"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";
import posthog from "posthog-js";
import type { ProductWithAreas } from "@/domain/product/types";

const StudioLayout = dynamic(
  () =>
    import("@/components/studio/StudioLayout").then((m) => ({
      default: m.StudioLayout,
    })),
);

const OrderStyleStudioLayout = dynamic(
  () =>
    import("@/components/studio/OrderStyleStudioLayout").then((m) => ({
      default: m.OrderStyleStudioLayout,
    })),
);

interface StudioClientProps {
  product: ProductWithAreas;
  mode?: string;
}

export function StudioClient({ product, mode }: StudioClientProps) {
  // Analytics: track studio open
  useEffect(() => {
    posthog.capture("hat_studio_opened", { product_id: product.id });
  }, [product.id]);

  // 스튜디오는 항상 최상단(캔버스)에서 시작 — dynamic 로드 레이아웃 시프트·스크롤 복원으로
  // 하단 제품 상세로 스크롤된 채 열리는 것 방지
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);
    // 캔버스가 dynamic 로드되며 늦게 채워지는 경우 대비, 다음 프레임에 한 번 더
    const raf = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(raf);
  }, []);

  const scrollToDetail = () => {
    const detailSection = document.getElementById("product-detail-section");
    if (detailSection) {
      detailSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isOrderMode = mode === "order";

  return (
    <div className='w-full'>
      <div className='relative'>
        {isOrderMode ? (
          <OrderStyleStudioLayout
            productId={product.id}
            productName={product.name}
            product={product}
          />
        ) : (
          <StudioLayout
            productId={product.id}
            productName={product.name}
            product={product}
          />
        )}

        {!isOrderMode && product.detailImageUrl && (
          <button
            onClick={scrollToDetail}
            className='absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce cursor-pointer group'
          >
            <div className='flex flex-col items-center bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg group-hover:bg-white transition-colors'>
              <span className='text-sm font-medium text-gray-600'>
                제품 상세 보기
              </span>
              <ChevronDown className='w-5 h-5 text-gray-500' />
            </div>
          </button>
        )}
      </div>

      {!isOrderMode && product.detailImageUrl && (
        <div id='product-detail-section' className='bg-white'>
          <div className='relative w-full max-w-3xl mx-auto'>
            <Image
              src={product.detailImageUrl}
              alt={`${product.name} 상세 정보`}
              width={1200}
              height={1600}
              sizes="(max-width: 768px) 100vw, 768px"
              className='w-full h-auto'
            />
          </div>
        </div>
      )}
    </div>
  );
}
