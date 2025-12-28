/**
 * 배송 정보 API
 * GET: 배송 정보 조회
 * POST: 송장 등록 및 배송 중 상태 변경
 */

import { NextRequest, NextResponse } from 'next/server'
import { orderRepository } from '@/infrastructure/supabase/order-repository'
import type { TrackingInfo, CarrierCode } from '@/domain/order/types'

interface Params {
  params: Promise<{ orderNumber: string }>
}

/**
 * GET /api/orders/[orderNumber]/shipping
 * 배송 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { orderNumber } = await params
    const order = await orderRepository.useServerClient().findByOrderNumber(orderNumber)

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        trackingInfo: order.trackingInfo || null,
        shippingInfo: order.shippingInfo,
      },
    })
  } catch (error) {
    console.error('GET /api/orders/[orderNumber]/shipping error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/orders/[orderNumber]/shipping
 * 송장 등록 및 배송 중 상태 변경
 */
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    // 간단한 쿠키 기반 인증 체크
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { orderNumber } = await params
    const body = await request.json()

    const { carrier, trackingNumber } = body as {
      carrier: CarrierCode
      trackingNumber: string
    }

    // 필수 필드 검증
    if (!carrier || !trackingNumber) {
      return NextResponse.json(
        { error: 'carrier and trackingNumber are required' },
        { status: 400 }
      )
    }

    // 택배사 코드 검증
    const validCarriers: CarrierCode[] = ['cj', 'hanjin', 'logen', 'lotte', 'post']
    if (!validCarriers.includes(carrier)) {
      return NextResponse.json(
        { error: 'Invalid carrier code' },
        { status: 400 }
      )
    }

    // 주문 조회
    const order = await orderRepository.useServerClient().findByOrderNumber(orderNumber)
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // 배송 정보 생성
    const trackingInfo: TrackingInfo = {
      carrier,
      trackingNumber,
      shippedAt: new Date().toISOString(),
    }

    // 배송 정보 업데이트
    await orderRepository.useServerClient().updateTrackingInfo(order.id, trackingInfo)

    // 상태를 shipped로 변경
    const updatedOrder = await orderRepository.useServerClient().updateStatus({
      orderId: order.id,
      status: 'shipped',
      changedBy: 'admin',
      memo: `송장등록: ${carrier} ${trackingNumber}`,
    })

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        trackingInfo,
      },
    })
  } catch (error) {
    console.error('POST /api/orders/[orderNumber]/shipping error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
