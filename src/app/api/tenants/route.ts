/**
 * 테넌트 목록 API
 * GET: 전체 테넌트 목록 조회
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/supabase'

interface TenantRow {
  id: string
  name: string
  slug: string
  logo_url: string | null
  contact_email: string
}

/**
 * GET /api/tenants
 * 전체 테넌트 목록 조회
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, logo_url, contact_email')
      .order('name', { ascending: true })

    if (error) {
      console.error('Tenants fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      )
    }

    const tenants = data as TenantRow[]

    // camelCase 변환
    const result = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      logoUrl: t.logo_url,
      contactEmail: t.contact_email,
    }))

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('GET /api/tenants error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
