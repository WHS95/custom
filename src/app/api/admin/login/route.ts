/**
 * 관리자 로그인 API
 * POST: 로그인
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/supabase'
import bcrypt from 'bcryptjs'

interface LoginRequest {
  username: string
  password: string
}

interface TenantAdmin {
  id: string
  tenant_id: string
  username: string
  password_hash: string
  display_name: string | null
  is_active: boolean
}

interface Tenant {
  id: string
  name: string
  slug: string
}

/**
 * POST /api/admin/login
 * 관리자 로그인
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequest
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '아이디와 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // 관리자 계정 조회
    const { data: admin, error: adminError } = await (supabase as any)
      .schema('runhousecustom')
      .from('tenant_admins')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single() as { data: TenantAdmin | null, error: any }

    if (adminError || !admin) {
      return NextResponse.json(
        { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: '아이디 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }

    // 테넌트 정보 조회
    const { data: tenant, error: tenantError } = await (supabase as any)
      .schema('runhousecustom')
      .from('tenants')
      .select('id, name, slug')
      .eq('id', admin.tenant_id)
      .single() as { data: Tenant | null, error: any }

    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: '테넌트 정보를 찾을 수 없습니다' },
        { status: 500 }
      )
    }

    // 마지막 로그인 시간 업데이트
    await (supabase as any)
      .schema('runhousecustom')
      .from('tenant_admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id)

    // 응답 생성 (쿠키 설정)
    const response = NextResponse.json({
      success: true,
      data: {
        adminId: admin.id,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
        displayName: admin.display_name || admin.username,
      }
    })

    // 쿠키 설정 (7일 유효)
    const cookieOptions = {
      path: '/',
      httpOnly: false, // 클라이언트에서 접근 가능
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7일
      sameSite: 'lax' as const,
    }

    response.cookies.set('admin_auth', 'true', cookieOptions)
    response.cookies.set('admin_id', admin.id, cookieOptions)
    response.cookies.set('tenant_id', tenant.id, cookieOptions)
    response.cookies.set('tenant_slug', tenant.slug, cookieOptions)

    return response
  } catch (error) {
    console.error('POST /api/admin/login error:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
