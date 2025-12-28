"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import type { Product } from "@/domain/product/types"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  // 첫 번째 색상의 첫 번째 이미지를 대표 이미지로 사용
  const thumbnailImage = product.images?.[0]?.url || null

  return (
    <Link href={`/studio/${product.id}`}>
      <Card className="group cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden">
        <div className="aspect-square relative bg-gray-100">
          {thumbnailImage ? (
            <img
              src={thumbnailImage}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🧢</div>
                <p className="text-sm">{product.name}</p>
              </div>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {product.basePrice.toLocaleString()}원
            </span>
            <div className="flex gap-1">
              {product.variants.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: v.hex }}
                  title={v.label}
                />
              ))}
              {product.variants.length > 5 && (
                <span className="text-xs text-gray-400">
                  +{product.variants.length - 5}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
