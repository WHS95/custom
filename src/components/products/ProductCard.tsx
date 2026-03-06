"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/domain/product/types";
import { ArrowRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

const categoryLabel: Record<string, string> = {
  hat: "모자",
  clothing: "의류",
  accessory: "액세서리",
};

export function ProductCard({ product }: ProductCardProps) {
  const thumbnailImage = product.images?.[0]?.url || null;
  const hasPriceTiers = product.priceTiers && product.priceTiers.length > 0;
  const lowestTierPrice = hasPriceTiers
    ? Math.min(...product.priceTiers!.map((t) => t.unitPrice))
    : null;

  return (
    <Link href={`/studio/${product.id}`} className="group block">
      <Card className="overflow-hidden border border-gray-200 transition-all duration-300 group-hover:shadow-xl group-hover:border-gray-300 group-hover:-translate-y-1">
        {/* 이미지 영역 */}
        <div className="aspect-square relative bg-gray-50 overflow-hidden">
          {thumbnailImage ? (
            <Image
              src={thumbnailImage}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-2">🧢</div>
                <p className="text-xs font-medium">{product.name}</p>
              </div>
            </div>
          )}

          {/* 호버 오버레이 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              <span className="inline-flex items-center gap-1.5 bg-white text-black text-sm font-semibold px-4 py-2 rounded-full shadow-lg">
                커스텀 시작
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* 카테고리 뱃지 */}
          <Badge
            variant="secondary"
            className="absolute top-3 left-3 text-xs bg-white/90 backdrop-blur-sm shadow-sm"
          >
            {categoryLabel[product.category] || product.category}
          </Badge>
        </div>

        {/* 콘텐츠 영역 */}
        <CardContent className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-base leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between gap-2">
            {/* 가격 */}
            <div>
              <span className="text-lg font-bold text-blue-600">
                {product.basePrice.toLocaleString()}원
              </span>
              {lowestTierPrice && lowestTierPrice < product.basePrice && (
                <p className="text-xs text-gray-400 mt-0.5">
                  대량 주문 시 {lowestTierPrice.toLocaleString()}원~
                </p>
              )}
            </div>

            {/* 색상 스와치 */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {product.variants.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="w-5 h-5 rounded-full ring-1 ring-gray-300 ring-offset-1 transition-transform hover:scale-125"
                  style={{ backgroundColor: v.hex }}
                  title={v.label}
                />
              ))}
              {product.variants.length > 5 && (
                <span className="text-xs text-gray-400 ml-0.5">
                  +{product.variants.length - 5}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
