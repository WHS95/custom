/**
 * 주문 디자인 수정 API
 *
 * PATCH /api/orders/[orderNumber]/design - 디자인 수정 (디자인 확정 전까지만)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, SCHEMA_NAME } from '@/infrastructure/supabase'

interface RouteParams {
  params: Promise<{ orderNumber: string }>
}

interface DesignLayer {
  id: string
  type: 'image' | 'text'
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  view: string
  color?: string
}

interface ItemUpdate {
  id: string
  designSnapshot: DesignLayer[]
}

/**
 * PATCH - 디자인 수정
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = await params
    const body = await request.json()

    const supabase = createServerSupabaseClient()

    // 1. 주문 조회
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. 디자인 확정 전인지 확인
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: '디자인이 확정되어 수정할 수 없습니다.' },
        { status: 403 }
      )
    }

    // 3. 아이템별 디자인 업데이트
    const items: ItemUpdate[] = body.items || []

    for (const item of items) {
      const { error: updateError } = await supabase
        .from('order_items')
        .update({
          design_snapshot: item.designSnapshot as unknown as Record<string, unknown>,
        })
        .eq('id', item.id)
        .eq('order_id', order.id)

      if (updateError) {
        console.error('아이템 업데이트 에러:', updateError)
        throw new Error(`아이템 업데이트 실패: ${updateError.message}`)
      }
    }

    // 4. 주문 updated_at 갱신
    await supabase
      .from('orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', order.id)

    return NextResponse.json({
      success: true,
      message: '디자인이 저장되었습니다.',
    })
  } catch (error) {
    console.error('디자인 수정 에러:', error)
    return NextResponse.json(
      { error: '디자인 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}
