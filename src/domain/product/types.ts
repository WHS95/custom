/**
 * 상품 도메인 타입 정의
 */

export type ProductCategory = "hat" | "clothing" | "accessory";

/**
 * 수량 구간별 단가 (대량 구매 할인)
 */
export interface PriceTier {
  minQuantity: number; // 최소 수량 (예: 1, 5, 10, 20, 50)
  unitPrice: number; // 해당 구간 단가 (원)
}

export type ViewName = "front" | "back" | "left" | "right" | "top";

/**
 * 상품 변형 (색상별 옵션)
 */
export interface ProductVariant {
  id: string; // 색상 ID (예: 'black')
  label: string; // 색상 라벨 (예: 'Midnight Black')
  hex: string; // HEX 코드 (예: '#000000')
  sizes: string[]; // 사이즈 목록 (예: ['S', 'M', 'L', 'XL', 'FREE'])
}

/**
 * 상품 이미지 정보
 */
export interface ProductImage {
  colorId: string; // 색상 ID
  view: ViewName; // 뷰 (front, back, etc)
  url: string; // 이미지 URL
}

/**
 * 커스터마이즈 가능 영역
 */
export interface CustomizableArea {
  id: string;
  productId: string;
  colorId?: string | null; // 색상 ID (null이면 모든 색상 공통)
  viewName: ViewName;
  displayName: string;
  zoneX: number; // 인쇄 영역 X (%)
  zoneY: number; // 인쇄 영역 Y (%)
  zoneWidth: number; // 인쇄 영역 너비 (%)
  zoneHeight: number; // 인쇄 영역 높이 (%)
  imageUrl?: string; // 해당 뷰 기본 이미지
  isEnabled: boolean;
  sortOrder: number;
}

/**
 * 상품 엔티티
 */
export interface Product {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  category: ProductCategory;
  basePrice: number;
  images: ProductImage[];
  variants: ProductVariant[];
  priceTiers?: PriceTier[]; // 수량 구간별 할인 가격표
  detailImageUrl?: string; // 제품 상세 이미지 URL (스튜디오 페이지 하단 표시)
  adminMessage?: string; // 주문 전 고객 확인 메시지
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 상품 + 커스터마이즈 영역 (상세 조회용)
 */
export interface ProductWithAreas extends Product {
  customizableAreas: CustomizableArea[];
}

/**
 * 상품 생성 DTO
 */
export interface CreateProductDTO {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  category: ProductCategory;
  basePrice: number;
  priceTiers?: PriceTier[];
  images?: ProductImage[];
  variants: ProductVariant[];
  customizableAreas?: Omit<CustomizableArea, "id" | "productId">[];
}

/**
 * 상품 수정 DTO
 */
export interface UpdateProductDTO {
  name?: string;
  slug?: string;
  description?: string;
  category?: ProductCategory;
  basePrice?: number;
  priceTiers?: PriceTier[] | null; // null이면 할인 가격표 삭제
  images?: ProductImage[];
  variants?: ProductVariant[];
  detailImageUrl?: string | null; // 제품 상세 이미지 URL (null이면 삭제)
  adminMessage?: string | null; // 주문 전 고객 확인 메시지 (null이면 삭제)
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * 커스터마이즈 영역 생성/수정 DTO
 */
export interface UpsertCustomizableAreaDTO {
  colorId?: string | null; // 색상 ID (null이면 모든 색상 공통)
  viewName: ViewName;
  displayName: string;
  zoneX: number;
  zoneY: number;
  zoneWidth: number;
  zoneHeight: number;
  imageUrl?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}
