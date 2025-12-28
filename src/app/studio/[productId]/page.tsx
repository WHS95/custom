"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { StudioLayout } from "@/components/studio/StudioLayout"
import { Loader2 } from "lucide-react"
import type { ProductWithAreas } from "@/domain/product/types"

export default function StudioPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [product, setProduct] = useState<ProductWithAreas | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}?withAreas=true`)
        const json = await res.json()

        if (json.success) {
          setProduct(json.data)
        } else {
          setError("상품을 찾을 수 없습니다")
        }
      } catch (err) {
        console.error("Failed to fetch product:", err)
        setError("상품 정보를 불러오는데 실패했습니다")
      } finally {
        setIsLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">스튜디오 로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-gray-700 mb-2">
            {error || "상품을 찾을 수 없습니다"}
          </h1>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
          >
            상품 목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  // 상품 정보를 StudioLayout에 전달하여 동적 이미지/색상 사용
  return (
    <div className="w-full">
      <StudioLayout
        productId={product.id}
        productName={product.name}
        product={product}
      />
    </div>
  )
}
