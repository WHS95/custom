/**
 * 상품 도메인 타입 정의
 */

export type ProductCategory = 'hat' | 'clothing' | 'accessory'

export type ViewName = 'front' | 'back' | 'left' | 'right' | 'top'

/**
 * 상품 변형 (색상별 옵션)
 */
export interface ProductVariant {
  id: string        // 색상 ID (예: 'black')
  label: string     // 색상 라벨 (예: 'Midnight Black')
  hex: string       // HEX 코드 (예: '#000000')
  sizes: string[]   // 사이즈 목록 (예: ['S', 'M', 'L', 'XL', 'FREE'])
}

/**
 * 상품 이미지 정보
 */
export interface ProductImage {
  colorId: string   // 색상 ID
  view: ViewName    // 뷰 (front, back, etc)
  url: string       // 이미지 URL
}

/**
 * 커스터마이즈 가능 영역
 */
export interface CustomizableArea {
  id: string
  productId: string
  viewName: ViewName
  displayName: string
  zoneX: number       // 인쇄 영역 X (%)
  zoneY: number       // 인쇄 영역 Y (%)
  zoneWidth: number   // 인쇄 영역 너비 (%)
  zoneHeight: number  // 인쇄 영역 높이 (%)
  imageUrl?: string   // 해당 뷰 기본 이미지
  isEnabled: boolean
  sortOrder: number
}

/**
 * 상품 엔티티
 */
export interface Product {
  id: string
  tenantId: string
  name: string
  slug: string
  description?: string
  category: ProductCategory
  basePrice: number
  images: ProductImage[]
  variants: ProductVariant[]
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/**
 * 상품 + 커스터마이즈 영역 (상세 조회용)
 */
export interface ProductWithAreas extends Product {
  customizableAreas: CustomizableArea[]
}

/**
 * 상품 생성 DTO
 */
export interface CreateProductDTO {
  tenantId: string
  name: string
  slug: string
  description?: string
  category: ProductCategory
  basePrice: number
  images?: ProductImage[]
  variants: ProductVariant[]
  customizableAreas?: Omit<CustomizableArea, 'id' | 'productId'>[]
}

/**
 * 상품 수정 DTO
 */
export interface UpdateProductDTO {
  name?: string
  slug?: string
  description?: string
  category?: ProductCategory
  basePrice?: number
  images?: ProductImage[]
  variants?: ProductVariant[]
  isActive?: boolean
  sortOrder?: number
}

/**
 * 커스터마이즈 영역 생성/수정 DTO
 */
export interface UpsertCustomizableAreaDTO {
  viewName: ViewName
  displayName: string
  zoneX: number
  zoneY: number
  zoneWidth: number
  zoneHeight: number
  imageUrl?: string
  isEnabled?: boolean
  sortOrder?: number
}
