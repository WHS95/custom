/**
 * 후기 개별 API
 * GET: 후기 상세 조회
 * PATCH: 후기 수정/승인/거절
 * DELETE: 후기 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/supabase'
import { DEFAULT_TENANT_ID } from '@/application/tenant-service'
import type { Review, UpdateReviewDTO } from '@/domain/review'

// DB 레코드 → Review 변환
function toReview(row: any): Review {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    orderId: row.order_id,
    authorType: row.author_type,
    authorName: row.author_name,
    organizationName: row.organization_name,
    title: row.title,
    content: row.content,
    rating: row.rating,
    images: row.images || [],
    status: row.status,
    adminMemo: row.admin_memo,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  }
}

/**
 * GET /api/reviews/[reviewId]
 * 후기 상세 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const supabase = createServerSupabaseClient()

    const { data, error } = await (supabase as any)
      .schema('runhousecustom')
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: toReview(data),
    })
  } catch (error) {
    console.error('GET /api/reviews/[reviewId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reviews/[reviewId]
 * 후기 수정/승인/거절
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params

    // 관리자 인증 확인
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json() as UpdateReviewDTO

    const supabase = createServerSupabaseClient()

    // 업데이트 데이터 구성
    const updateData: Record<string, any> = {}

    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.rating !== undefined) updateData.rating = body.rating
    if (body.images !== undefined) updateData.images = body.images
    if (body.adminMemo !== undefined) updateData.admin_memo = body.adminMemo
    if (body.isFeatured !== undefined) updateData.is_featured = body.isFeatured
    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder

    // 상태 변경 처리
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'approved') {
        updateData.approved_at = new Date().toISOString()
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No update data provided' },
        { status: 400 }
      )
    }

    const { data, error } = await (supabase as any)
      .schema('runhousecustom')
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .single()

    if (error) {
      console.error('Update review error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update review' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }

    const statusMessages: Record<string, string> = {
      approved: '후기가 승인되었습니다',
      rejected: '후기가 거절되었습니다',
      pending: '후기가 승인 대기 상태로 변경되었습니다',
    }

    return NextResponse.json({
      success: true,
      data: toReview(data),
      message: body.status ? statusMessages[body.status] : '후기가 수정되었습니다',
    })
  } catch (error) {
    console.error('PATCH /api/reviews/[reviewId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[reviewId]
 * 후기 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params

    // 관리자 인증 확인
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()

    const { error } = await (supabase as any)
      .schema('runhousecustom')
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      console.error('Delete review error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '후기가 삭제되었습니다',
    })
  } catch (error) {
    console.error('DELETE /api/reviews/[reviewId] error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
