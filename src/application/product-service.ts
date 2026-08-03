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
 * @param productId 상품 ID
 * @param colorId 색상 ID (선택사항, 지정하면 해당 색상 + 공통(null) 영역 반환)
 */
export async function getCustomizableAreas(productId: string, colorId?: string): Promise<CustomizableArea[]> {
  return productRepository.useServerClient().findCustomizableAreas(productId, colorId)
}

/**
 * 뷰별 인쇄 영역 실측 정보 맵 — 공장 작업지시(실물 치수·시안)용.
 * 실측 가로(printWidthCm)가 설정된 활성 영역만 포함. 색상별 영역이 있으면
 * 우선하고, 없으면 공통(color_id=null) 영역을 쓴다.
 */
export async function getPrintAreas(
  productId: string,
  colorId: string,
): Promise<Record<string, {
  zoneX: number;
  zoneY: number;
  zoneWidth: number;
  zoneHeight: number;
  printWidthCm: number;
}>> {
  const areas = await getCustomizableAreas(productId, colorId);
  const byView: Record<string, CustomizableArea> = {};
  for (const a of areas) {
    if (!a.isEnabled || a.printWidthCm == null) continue;
    const existing = byView[a.viewName];
    // 색상 지정 영역이 공통 영역보다 우선
    if (!existing || (a.colorId && !existing.colorId)) {
      byView[a.viewName] = a;
    }
  }
  const result: Record<string, {
    zoneX: number; zoneY: number; zoneWidth: number; zoneHeight: number; printWidthCm: number;
  }> = {};
  for (const [view, a] of Object.entries(byView)) {
    result[view] = {
      zoneX: a.zoneX,
      zoneY: a.zoneY,
      zoneWidth: a.zoneWidth,
      zoneHeight: a.zoneHeight,
      printWidthCm: a.printWidthCm as number,
    };
  }
  return result;
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
