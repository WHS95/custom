"use client"

import { ProductCard } from "./ProductCard"
import type { Product } from "@/domain/product/types"

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          등록된 상품이 없습니다
        </h2>
        <p className="text-gray-500">
          관리자가 상품을 추가하면 여기에 표시됩니다.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
