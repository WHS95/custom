"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { StudioLayout } from "@/components/studio/StudioLayout";
import { OrderStyleStudioLayout } from "@/components/studio/OrderStyleStudioLayout";
import { Loader2, ChevronDown } from "lucide-react";
import type { ProductWithAreas } from "@/domain/product/types";

export default function StudioPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = params.productId as string;
  const mode = searchParams.get("mode");

  const [product, setProduct] = useState<ProductWithAreas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}?withAreas=true`);
        const json = await res.json();

        if (json.success) {
          setProduct(json.data);
        } else {
          setError("상품을 찾을 수 없습니다");
        }
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError("상품 정보를 불러오는데 실패했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-gray-400 mb-4' />
          <p className='text-gray-500'>스튜디오 로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <div className='text-6xl mb-4'>😕</div>
          <h1 className='text-xl font-bold text-gray-700 mb-2'>
            {error || "상품을 찾을 수 없습니다"}
          </h1>
          <button
            onClick={() => router.push("/")}
            className='mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800'
          >
            상품 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 스크롤 힌트 클릭 핸들러
  const scrollToDetail = () => {
    const detailSection = document.getElementById("product-detail-section");
    if (detailSection) {
      detailSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isOrderMode = mode === "order";

  // 상품 정보를 StudioLayout에 전달하여 동적 이미지/색상 사용
  return (
    <div className='w-full'>
      {/* 커스터마이징 스튜디오 */}
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

        {/* 스크롤 힌트 - 제품 상세가 있을 때만 표시 */}
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

      {/* 제품 상세 이미지 */}
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
