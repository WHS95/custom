/**
 * 후기 API
 * GET: 후기 목록 조회
 * POST: 후기 작성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/infrastructure/supabase'
import { DEFAULT_TENANT_ID } from '@/application/tenant-service'
import type { Review, CreateReviewDTO, ReviewImage } from '@/domain/review'

const BUCKET_NAME = 'product-images'

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
 * GET /api/reviews
 * 후기 목록 조회
 * - 공개: 승인된 후기만 (status=approved)
 * - 관리자: 전체 후기 (admin=true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'
    const status = searchParams.get('status')
    const featured = searchParams.get('featured')
    const limit = parseInt(searchParams.get('limit') || '50')

    const supabase = createServerSupabaseClient()

    let query = (supabase as any)
      .schema('runhousecustom')
      .from('reviews')
      .select('*')
      .eq('tenant_id', DEFAULT_TENANT_ID)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(limit)

    // 관리자가 아니면 승인된 후기만
    if (!isAdmin) {
      query = query.eq('status', 'approved')
    } else if (status) {
      query = query.eq('status', status)
    }

    // 대표 후기만
    if (featured === 'true') {
      query = query.eq('is_featured', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get reviews error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    const reviews = (data || []).map(toReview)

    return NextResponse.json({
      success: true,
      data: reviews,
    })
  } catch (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews
 * 후기 작성
 * - 관리자 작성: 자동 승인
 * - 고객 작성: 승인 대기
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateReviewDTO & {
      tenantId?: string
      imageDataList?: string[]  // base64 이미지 목록
    }

    const {
      orderId,
      authorType = 'customer',
      authorName,
      organizationName,
      title,
      content,
      rating,
      images = [],
      imageDataList = [],
      tenantId = DEFAULT_TENANT_ID,
    } = body

    if (!authorName || !content || !rating) {
      return NextResponse.json(
        { success: false, error: 'authorName, content, rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // 이미지 업로드 (base64 → Storage)
    const uploadedImages: ReviewImage[] = [...images]

    for (let i = 0; i < imageDataList.length && uploadedImages.length < 5; i++) {
      const imageData = imageDataList[i]
      if (!imageData) continue

      try {
        const base64Data = imageData.split(',')[1]
        const mimeType = imageData.split(';')[0].split(':')[1]
        const ext = mimeType?.split('/')[1] || 'png'

        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: mimeType })

        const fileName = `reviews/${tenantId}/${Date.now()}-${i}.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, blob, {
            upsert: true,
            contentType: mimeType || 'image/png',
          })

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(uploadData.path)

          uploadedImages.push({ url: urlData.publicUrl })
        }
      } catch (imgError) {
        console.error('Image upload error:', imgError)
      }
    }

    // 관리자 인증 확인
    const adminAuth = request.cookies.get('admin_auth')?.value
    const isAdmin = adminAuth === 'true' && authorType === 'admin'

    // 후기 생성
    const { data, error } = await (supabase as any)
      .schema('runhousecustom')
      .from('reviews')
      .insert({
        tenant_id: tenantId,
        order_id: orderId || null,
        author_type: isAdmin ? 'admin' : 'customer',
        author_name: authorName,
        organization_name: organizationName || null,
        title: title || null,
        content,
        rating,
        images: uploadedImages,
        status: isAdmin ? 'approved' : 'pending',  // 관리자는 자동 승인
        approved_at: isAdmin ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (error) {
      console.error('Create review error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create review' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: toReview(data),
      message: isAdmin ? '후기가 등록되었습니다' : '후기가 제출되었습니다. 관리자 승인 후 게시됩니다.',
    })
  } catch (error) {
    console.error('POST /api/reviews error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
