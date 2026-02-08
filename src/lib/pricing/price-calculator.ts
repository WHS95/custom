/**
 * 수량 구간별 가격 계산 유틸리티
 */

import type { PriceTier } from "@/domain/product/types";

/**
 * 수량에 따른 단가 계산
 * priceTiers가 없으면 basePrice 그대로 반환
 * 수량에 맞는 가장 높은 minQuantity 구간의 unitPrice 반환
 */
export function getUnitPrice(
  basePrice: number,
  quantity: number,
  priceTiers?: PriceTier[] | null,
): number {
  if (!priceTiers || priceTiers.length === 0) {
    return basePrice;
  }

  // minQuantity 기준 내림차순 정렬
  const sorted = [...priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);

  // 수량 이하인 가장 큰 minQuantity 구간 찾기
  for (const tier of sorted) {
    if (quantity >= tier.minQuantity) {
      return tier.unitPrice;
    }
  }

  // 어떤 구간에도 해당하지 않으면 basePrice 반환
  return basePrice;
}

/**
 * 할인 금액 계산
 */
export function getDiscountAmount(
  basePrice: number,
  quantity: number,
  priceTiers?: PriceTier[] | null,
): number {
  const discountedPrice = getUnitPrice(basePrice, quantity, priceTiers);
  return (basePrice - discountedPrice) * quantity;
}

/**
 * 할인율 계산 (%)
 */
export function getDiscountRate(
  basePrice: number,
  quantity: number,
  priceTiers?: PriceTier[] | null,
): number {
  if (basePrice === 0) return 0;
  const discountedPrice = getUnitPrice(basePrice, quantity, priceTiers);
  return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
}

/**
 * 가격표에서 최대 할인 구간 (BEST) 가져오기
 */
export function getBestTier(priceTiers?: PriceTier[] | null): PriceTier | null {
  if (!priceTiers || priceTiers.length === 0) return null;
  return [...priceTiers].sort((a, b) => b.minQuantity - a.minQuantity)[0];
}

/**
 * 가격표 정렬 (minQuantity 오름차순)
 */
export function sortPriceTiers(priceTiers: PriceTier[]): PriceTier[] {
  return [...priceTiers].sort((a, b) => a.minQuantity - b.minQuantity);
}
