/**
 * 상품 서비스 (Application Layer)
 */

import { productRepository } from '@/infrastructure/supabase/product-repository'
import type {
  Product,
  ProductWithAreas,
  CustomizableArea,
  CreateProductDTO,
  UpdateProductDTO,
  UpsertCustomizableAreaDTO,
} from '@/domain/product/types'

/**
 * 테넌트별 상품 목록 조회
 */
export async function getProductsByTenant(
  tenantId: string,
  includeInactive = false
): Promise<Product[]> {
  return productRepository.useServerClient().findByTenant(tenantId, includeInactive)
}

/**
 * 상품 ID로 조회
 */
export async function getProductById(productId: string): Promise<Product | null> {
  return productRepository.useServerClient().findById(productId)
}

/**
 * 테넌트 슬러그 + 상품 슬러그로 조회
 */
export async function getProductBySlug(
  tenantId: string,
  productSlug: string
): Promise<Product | null> {
  return productRepository.useServerClient().findBySlug(tenantId, productSlug)
}

/**
 * 상품 + 커스터마이즈 영역 조회
 */
export async function getProductWithAreas(productId: string): Promise<ProductWithAreas | null> {
  return productRepository.useServerClient().findWithAreas(productId)
}

/**
 * 상품 생성
 */
export async function createProduct(dto: CreateProductDTO): Promise<Product> {
  return productRepository.useServerClient().create(dto)
}

/**
 * 상품 수정
 */
export async function updateProduct(
  productId: string,
  dto: UpdateProductDTO
): Promise<Product> {
  return productRepository.useServerClient().update(productId, dto)
}

/**
 * 상품 삭제
 */
export async function deleteProduct(productId: string): Promise<void> {
  return productRepository.useServerClient().delete(productId)
}

/**
 * 커스터마이즈 영역 목록 조회
 */
export async function getCustomizableAreas(productId: string): Promise<CustomizableArea[]> {
  return productRepository.useServerClient().findCustomizableAreas(productId)
}

/**
 * 커스터마이즈 영역 저장 (upsert)
 */
export async function saveCustomizableArea(
  productId: string,
  dto: UpsertCustomizableAreaDTO
): Promise<CustomizableArea> {
  return productRepository.useServerClient().upsertCustomizableArea(productId, dto)
}

/**
 * 커스터마이즈 영역 삭제
 */
export async function deleteCustomizableArea(areaId: string): Promise<void> {
  return productRepository.useServerClient().deleteCustomizableArea(areaId)
}
