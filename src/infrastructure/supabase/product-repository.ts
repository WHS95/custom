/**
 * Supabase 상품 레포지토리 구현
 */

import { createServerSupabaseClient, getSupabaseClient } from './client'
import type { IProductRepository } from '@/domain/product/repository'
import type {
  Product,
  ProductWithAreas,
  CustomizableArea,
  CreateProductDTO,
  UpdateProductDTO,
  UpsertCustomizableAreaDTO,
  ProductImage,
  ProductVariant,
  ViewName,
  ProductCategory,
} from '@/domain/product/types'

/**
 * Supabase 상품 레포지토리
 */
export class SupabaseProductRepository implements IProductRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null
  private useServer = false

  /**
   * 클라이언트 가져오기
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getClient(): any {
    if (this.client) return this.client

    if (this.useServer) {
      return createServerSupabaseClient()
    }

    return getSupabaseClient()
  }

  /**
   * 서버 사이드에서 사용할 때 서비스 역할 클라이언트로 전환
   */
  useServerClient(): this {
    this.useServer = true
    this.client = null
    return this
  }

  /**
   * 테넌트별 상품 목록 조회
   */
  async findByTenant(tenantId: string, includeInactive = false): Promise<Product[]> {
    const client = this.getClient()

    let query = client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error || !data) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => this.mapToProduct(row))
  }

  /**
   * 상품 ID로 조회
   */
  async findById(productId: string): Promise<Product | null> {
    const client = this.getClient()

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !data) return null
    return this.mapToProduct(data)
  }

  /**
   * 상품 슬러그로 조회 (테넌트 + 슬러그)
   */
  async findBySlug(tenantId: string, slug: string): Promise<Product | null> {
    const client = this.getClient()

    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('slug', slug)
      .single()

    if (error || !data) return null
    return this.mapToProduct(data)
  }

  /**
   * 상품 + 커스터마이즈 영역 조회
   */
  async findWithAreas(productId: string): Promise<ProductWithAreas | null> {
    const client = this.getClient()

    const { data: productData, error: productError } = await client
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !productData) return null

    const { data: areasData, error: areasError } = await client
      .from('product_customizable_areas')
      .select('*')
      .eq('product_id', productId)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true })

    if (areasError) {
      console.error('커스터마이즈 영역 조회 실패:', areasError)
    }

    const product = this.mapToProduct(productData)
    return {
      ...product,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customizableAreas: (areasData || []).map((row: any) => this.mapToCustomizableArea(row)),
    }
  }

  /**
   * 상품 생성
   */
  async create(dto: CreateProductDTO): Promise<Product> {
    const client = this.getClient()

    const { data, error } = await client
      .from('products')
      .insert({
        tenant_id: dto.tenantId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description || null,
        category: dto.category,
        base_price: dto.basePrice,
        images: dto.images || [],
        variants: dto.variants,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`상품 생성 실패: ${error.message}`)
    }

    // 커스터마이즈 영역 생성
    if (dto.customizableAreas && dto.customizableAreas.length > 0) {
      const areas = dto.customizableAreas.map((area, index) => ({
        product_id: data.id,
        view_name: area.viewName,
        display_name: area.displayName,
        zone_x: area.zoneX,
        zone_y: area.zoneY,
        zone_width: area.zoneWidth,
        zone_height: area.zoneHeight,
        image_url: area.imageUrl || null,
        is_enabled: area.isEnabled ?? true,
        sort_order: area.sortOrder ?? index,
      }))

      await client.from('product_customizable_areas').insert(areas)
    }

    return this.mapToProduct(data)
  }

  /**
   * 상품 수정
   */
  async update(productId: string, dto: UpdateProductDTO): Promise<Product> {
    const client = this.getClient()

    const updateData: Record<string, unknown> = {}
    if (dto.name !== undefined) updateData.name = dto.name
    if (dto.slug !== undefined) updateData.slug = dto.slug
    if (dto.description !== undefined) updateData.description = dto.description
    if (dto.category !== undefined) updateData.category = dto.category
    if (dto.basePrice !== undefined) updateData.base_price = dto.basePrice
    if (dto.images !== undefined) updateData.images = dto.images
    if (dto.variants !== undefined) updateData.variants = dto.variants
    if (dto.detailImageUrl !== undefined) updateData.detail_image_url = dto.detailImageUrl
    if (dto.isActive !== undefined) updateData.is_active = dto.isActive
    if (dto.sortOrder !== undefined) updateData.sort_order = dto.sortOrder

    const { data, error } = await client
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      throw new Error(`상품 수정 실패: ${error.message}`)
    }

    return this.mapToProduct(data)
  }

  /**
   * 상품 삭제
   */
  async delete(productId: string): Promise<void> {
    const client = this.getClient()

    const { error } = await client
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      throw new Error(`상품 삭제 실패: ${error.message}`)
    }
  }

  /**
   * 커스터마이즈 영역 조회
   * @param productId 상품 ID
   * @param colorId 색상 ID (선택사항, 지정하면 해당 색상 + 공통(null) 영역 반환)
   */
  async findCustomizableAreas(productId: string, colorId?: string): Promise<CustomizableArea[]> {
    const client = this.getClient()

    let query = client
      .from('product_customizable_areas')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true })

    // colorId가 지정되면 해당 색상 또는 공통(null) 영역만 필터링
    if (colorId !== undefined) {
      query = query.or(`color_id.eq.${colorId},color_id.is.null`)
    }

    const { data, error } = await query

    if (error || !data) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((row: any) => this.mapToCustomizableArea(row))
  }

  /**
   * 커스터마이즈 영역 생성/수정
   */
  async upsertCustomizableArea(
    productId: string,
    dto: UpsertCustomizableAreaDTO
  ): Promise<CustomizableArea> {
    const client = this.getClient()

    const { data, error } = await client
      .from('product_customizable_areas')
      .upsert(
        {
          product_id: productId,
          color_id: dto.colorId ?? null,
          view_name: dto.viewName,
          display_name: dto.displayName,
          zone_x: dto.zoneX,
          zone_y: dto.zoneY,
          zone_width: dto.zoneWidth,
          zone_height: dto.zoneHeight,
          image_url: dto.imageUrl || null,
          is_enabled: dto.isEnabled ?? true,
          sort_order: dto.sortOrder ?? 0,
        },
        { onConflict: 'product_id,view_name,color_id' }
      )
      .select()
      .single()

    if (error) {
      throw new Error(`커스터마이즈 영역 저장 실패: ${error.message}`)
    }

    return this.mapToCustomizableArea(data)
  }

  /**
   * 커스터마이즈 영역 삭제
   */
  async deleteCustomizableArea(areaId: string): Promise<void> {
    const client = this.getClient()

    const { error } = await client
      .from('product_customizable_areas')
      .delete()
      .eq('id', areaId)

    if (error) {
      throw new Error(`커스터마이즈 영역 삭제 실패: ${error.message}`)
    }
  }

  // ============================================
  // Private Methods - Mapping
  // ============================================

  private mapToProduct(row: Record<string, unknown>): Product {
    return {
      id: row.id as string,
      tenantId: row.tenant_id as string,
      name: row.name as string,
      slug: row.slug as string,
      description: row.description as string | undefined,
      category: row.category as ProductCategory,
      basePrice: row.base_price as number,
      images: row.images as ProductImage[],
      variants: row.variants as ProductVariant[],
      detailImageUrl: row.detail_image_url as string | undefined,
      isActive: row.is_active as boolean,
      sortOrder: row.sort_order as number,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }

  private mapToCustomizableArea(row: Record<string, unknown>): CustomizableArea {
    return {
      id: row.id as string,
      productId: row.product_id as string,
      colorId: row.color_id as string | null | undefined,
      viewName: row.view_name as ViewName,
      displayName: row.display_name as string,
      zoneX: Number(row.zone_x),
      zoneY: Number(row.zone_y),
      zoneWidth: Number(row.zone_width),
      zoneHeight: Number(row.zone_height),
      imageUrl: row.image_url as string | undefined,
      isEnabled: row.is_enabled as boolean,
      sortOrder: row.sort_order as number,
    }
  }
}

// 싱글톤 인스턴스
export const productRepository = new SupabaseProductRepository()
