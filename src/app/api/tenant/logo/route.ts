/**
 * 테넌트 로고 API
 * POST: 로고 업로드
 * DELETE: 로고 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/supabase'
import { DEFAULT_TENANT_ID } from '@/application/tenant-service'

const BUCKET_NAME = 'product-images'

/**
 * POST /api/tenant/logo
 * 로고 이미지 업로드
 */
export async function POST(request: NextRequest) {
  try {
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenantId = DEFAULT_TENANT_ID, imageData } = body as {
      tenantId?: string
      imageData: string // base64
    }

    if (!imageData) {
      return NextResponse.json(
        { error: 'imageData is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Base64를 Blob으로 변환
    const base64Data = imageData.split(',')[1]
    const mimeType = imageData.split(';')[0].split(':')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: mimeType })

    // 파일 경로
    const path = `tenants/${tenantId}/logo.png`

    // 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, blob, {
        upsert: true,
        contentType: mimeType || 'image/png',
      })

    if (uploadError) {
      console.error('Logo upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload logo' },
        { status: 500 }
      )
    }

    // Public URL 가져오기
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(uploadData.path)

    const logoUrl = urlData.publicUrl

    // 테넌트 테이블 업데이트 (Supabase 스키마 타입 제한으로 any 사용)
    const { error: updateError } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any
    )
      .schema('runhousecustom')
      .from('tenants')
      .update({ logo_url: logoUrl })
      .eq('id', tenantId)

    if (updateError) {
      console.error('Tenant update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { logoUrl },
    })
  } catch (error) {
    console.error('POST /api/tenant/logo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tenant/logo
 * 로고 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID

    const supabase = createServerSupabaseClient()

    // 스토리지에서 삭제
    const path = `tenants/${tenantId}/logo.png`
    await supabase.storage.from(BUCKET_NAME).remove([path])

    // 테넌트 테이블 업데이트 (Supabase 스키마 타입 제한으로 any 사용)
    await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any
    )
      .schema('runhousecustom')
      .from('tenants')
      .update({ logo_url: null })
      .eq('id', tenantId)

    return NextResponse.json({
      success: true,
      message: 'Logo deleted',
    })
  } catch (error) {
    console.error('DELETE /api/tenant/logo error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
