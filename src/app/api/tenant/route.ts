/**
 * 테넌트 API
 * GET: 테넌트 설정 조회
 * PATCH: 테넌트 설정 업데이트 (관리자용)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getTenantById,
  updateTenantSettings,
  DEFAULT_TENANT_ID,
  TenantSettings,
} from '@/application/tenant-service'

/**
 * GET /api/tenant
 * 테넌트 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID

    const tenant = await getTenantById(tenantId)

    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    })
  } catch (error) {
    console.error('GET /api/tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/tenant
 * 테넌트 설정 업데이트 (관리자용)
 */
export async function PATCH(request: NextRequest) {
  try {
    // 간단한 쿠키 기반 인증 체크
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenantId = DEFAULT_TENANT_ID, settings } = body as {
      tenantId?: string
      settings: Partial<TenantSettings>
    }

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings required' },
        { status: 400 }
      )
    }

    const tenant = await updateTenantSettings(tenantId, settings)

    if (!tenant) {
      return NextResponse.json(
        { error: 'Failed to update tenant settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tenant,
    })
  } catch (error) {
    console.error('PATCH /api/tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
