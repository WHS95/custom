/**
 * 테넌트 서비스 (Application Layer)
 *
 * 테넌트 설정 관리 및 조회
 */

import { createServerSupabaseClient } from '@/infrastructure/supabase'

// 런하우스 기본 테넌트 ID
export const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001'

export type HatView = "front" | "left" | "right" | "back" | "top"

export interface Zone {
  x: number
  y: number
  width: number
  height: number
}

export interface ProductColor {
  id: string
  label: string
  hex: string
  views: Record<HatView, string>
}

/**
 * 데이터베이스에 저장되는 테넌트 설정
 * tenants.settings JSONB 필드
 */
export interface TenantSettings {
  // 가격 설정
  basePrice: number
  shippingFreeThreshold: number
  shippingCost: number
  currency: string

  // 스튜디오 설정
  colors: ProductColor[]
  safeZones: Record<HatView, Zone>
}

export interface Tenant {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  contactEmail: string
  contactPhone: string | null
  settings: TenantSettings
  createdAt: string
  updatedAt: string
}

// 기본 스튜디오 설정 (새 테넌트용)
export const DEFAULT_STUDIO_SETTINGS: Pick<TenantSettings, 'colors' | 'safeZones'> = {
  colors: [
    {
      id: "black",
      label: "Midnight Black",
      hex: "#000000",
      views: {
        front: "/assets/hats/black-front.png",
        left: "/assets/hats/black-left.png",
        right: "/assets/hats/black-right.png",
        back: "/assets/hats/black-back.png",
        top: "/assets/hats/black-top.png"
      }
    },
    {
      id: "khaki",
      label: "Desert Khaki",
      hex: "#C3B091",
      views: {
        front: "/assets/hats/khaki.png",
        left: "/assets/hats/khaki-side.png",
        right: "/assets/hats/khaki-side.png",
        back: "/assets/hats/khaki-back.png",
        top: "/assets/hats/khaki-top.png"
      }
    },
    {
      id: "beige",
      label: "Sand Beige",
      hex: "#F5F5DC",
      views: {
        front: "/assets/hats/beige.png",
        left: "/assets/hats/beige-side.png",
        right: "/assets/hats/beige-side.png",
        back: "/assets/hats/beige-back.png",
        top: "/assets/hats/beige-top.png"
      }
    },
    {
      id: "red",
      label: "Race Red",
      hex: "#FF0000",
      views: {
        front: "/assets/hats/red.png",
        left: "/assets/hats/red-side.png",
        right: "/assets/hats/red-side.png",
        back: "/assets/hats/red-back.png",
        top: "/assets/hats/red-top.png"
      }
    },
  ],
  safeZones: {
    front: { x: 30, y: 30, width: 40, height: 30 },
    left: { x: 30, y: 40, width: 40, height: 20 },
    right: { x: 30, y: 40, width: 40, height: 20 },
    back: { x: 30, y: 40, width: 40, height: 20 },
    top: { x: 25, y: 25, width: 50, height: 50 },
  }
}

/**
 * 테넌트 조회 (ID)
 */
export async function getTenantById(tenantId: string = DEFAULT_TENANT_ID): Promise<Tenant | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await (supabase as any)
    .schema('runhousecustom')
    .from('tenants')
    .select('*')
    .eq('id', tenantId)
    .single()

  if (error || !data) {
    console.error('Failed to fetch tenant:', error)
    return null
  }

  // 설정에 스튜디오 기본값 병합
  const settings = mergeWithDefaults(data.settings)

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    settings,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 테넌트 조회 (슬러그)
 */
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await (supabase as any)
    .schema('runhousecustom')
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) {
    console.error('Failed to fetch tenant by slug:', error)
    return null
  }

  const settings = mergeWithDefaults(data.settings)

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    settings,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * 테넌트 설정 업데이트
 */
export async function updateTenantSettings(
  tenantId: string,
  settings: Partial<TenantSettings>
): Promise<Tenant | null> {
  const supabase = createServerSupabaseClient()

  // 현재 설정 조회
  const current = await getTenantById(tenantId)
  if (!current) {
    return null
  }

  // 설정 병합
  const newSettings: TenantSettings = {
    ...current.settings,
    ...settings,
  }

  const { data, error } = await (supabase as any)
    .schema('runhousecustom')
    .from('tenants')
    .update({ settings: newSettings })
    .eq('id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Failed to update tenant settings:', error)
    return null
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    logoUrl: data.logo_url,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    settings: mergeWithDefaults(data.settings),
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

/**
 * DB 설정에 기본값 병합
 */
function mergeWithDefaults(dbSettings: any): TenantSettings {
  const settings = dbSettings || {}

  return {
    basePrice: settings.basePrice ?? 22400,
    shippingFreeThreshold: settings.shippingFreeThreshold ?? 50000,
    shippingCost: settings.shippingCost ?? 3000,
    currency: settings.currency ?? 'KRW',
    colors: settings.colors ?? DEFAULT_STUDIO_SETTINGS.colors,
    safeZones: settings.safeZones ?? DEFAULT_STUDIO_SETTINGS.safeZones,
  }
}
