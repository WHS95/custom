/**
 * 크루 할인 유틸리티
 * 등록된 러닝크루 회원(crew_staff)에게 즉시 할인 제공
 */

/** 크루 할인율 (10%) */
export const CREW_DISCOUNT_RATE = 0.1;

/**
 * 크루 할인 금액 계산
 * @param subtotal 상품 합계 (수량할인 적용 후)
 * @param isCrewMember 크루 회원 여부
 * @returns 할인 금액
 */
export function getCrewDiscountAmount(
  subtotal: number,
  isCrewMember: boolean
): number {
  if (!isCrewMember) return 0;
  return Math.floor(subtotal * CREW_DISCOUNT_RATE);
}

/**
 * 크루 할인율 텍스트
 */
export function getCrewDiscountLabel(): string {
  return `${Math.round(CREW_DISCOUNT_RATE * 100)}%`;
}
