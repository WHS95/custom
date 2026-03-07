"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Pencil,
  Trash2,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import type { Product, ProductCategory } from "@/domain/product/types";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hat: "모자",
  clothing: "의류",
  accessory: "액세서리",
};

export interface AdminProductCardProps {
  product: Product;
  tenantSlug: string;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleActive: (product: Product) => void;
}

export default function AdminProductCard({
  product,
  tenantSlug,
  onEdit,
  onDelete,
  onToggleActive,
}: AdminProductCardProps) {
  const router = useRouter();
  const basePath = `/admin/${tenantSlug}`;

  return (
    <Card className={`overflow-hidden ${!product.isActive ? "opacity-60" : ""}`}>
      {product.images?.[0]?.url ? (
        <div className='aspect-video bg-gray-100 overflow-hidden'>
          <img
            src={product.images[0].url}
            alt={product.name}
            className='w-full h-full object-contain'
          />
        </div>
      ) : (
        <div className='aspect-video bg-gray-100 flex items-center justify-center'>
          <Package className='h-8 w-8 text-gray-300' />
        </div>
      )}
      <CardHeader>
        <div className='flex justify-between items-start'>
          <div>
            <CardTitle className='text-lg'>{product.name}</CardTitle>
            <CardDescription>/{product.slug}</CardDescription>
          </div>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              product.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {product.isActive ? "활성" : "비활성"}
          </span>
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <span className='font-medium'>카테고리:</span>
          <span>{CATEGORY_LABELS[product.category]}</span>
        </div>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <span className='font-medium'>기본 가격:</span>
          <span>{product.basePrice.toLocaleString()}원</span>
          {product.priceTiers && product.priceTiers.length > 0 && (
            <span className='text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded'>
              할인 {product.priceTiers.length}구간
            </span>
          )}
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-600'>색상:</span>
          <div className='flex gap-1'>
            {product.variants.map((v) => (
              <div
                key={v.id}
                className='w-5 h-5 rounded-full border border-gray-300'
                style={{ backgroundColor: v.hex }}
                title={v.label}
              />
            ))}
          </div>
        </div>
        <div className='flex gap-2 pt-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.push(`${basePath}/products/${product.id}`)}
          >
            <ImageIcon className='mr-1 h-3 w-3' /> 상품관리
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onEdit(product)}
          >
            <Pencil className='mr-1 h-3 w-3' /> 수정
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onToggleActive(product)}
          >
            {product.isActive ? "비활성" : "활성"}
          </Button>
          <Button
            variant='ghost'
            size='sm'
            className='text-red-500 hover:text-red-600 hover:bg-red-50'
            onClick={() => onDelete(product)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
