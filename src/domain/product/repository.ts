/**
 * 상품 레포지토리 인터페이스
 */

import type {
  Product,
  ProductWithAreas,
  CustomizableArea,
  CreateProductDTO,
  UpdateProductDTO,
  UpsertCustomizableAreaDTO,
} from './types'

export interface IProductRepository {
  /**
   * 테넌트별 상품 목록 조회
   */
  findByTenant(tenantId: string, includeInactive?: boolean): Promise<Product[]>

  /**
   * 상품 ID로 조회
   */
  findById(productId: string): Promise<Product | null>

  /**
   * 상품 슬러그로 조회 (테넌트 + 슬러그)
   */
  findBySlug(tenantId: string, slug: string): Promise<Product | null>

  /**
   * 상품 + 커스터마이즈 영역 조회
   */
  findWithAreas(productId: string): Promise<ProductWithAreas | null>

  /**
   * 상품 생성
   */
  create(dto: CreateProductDTO): Promise<Product>

  /**
   * 상품 수정
   */
  update(productId: string, dto: UpdateProductDTO): Promise<Product>

  /**
   * 상품 삭제
   */
  delete(productId: string): Promise<void>

  /**
   * 커스터마이즈 영역 조회
   */
  findCustomizableAreas(productId: string): Promise<CustomizableArea[]>

  /**
   * 커스터마이즈 영역 생성/수정
   */
  upsertCustomizableArea(
    productId: string,
    dto: UpsertCustomizableAreaDTO
  ): Promise<CustomizableArea>

  /**
   * 커스터마이즈 영역 삭제
   */
  deleteCustomizableArea(areaId: string): Promise<void>
}
