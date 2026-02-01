/**
 * 주문 API 라우트
 *
 * POST /api/orders - 주문 생성
 * GET /api/orders - 주문 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createOrder,
  getOrdersByPhone,
  getOrdersByUserId,
  getOrdersForAdmin,
  DEFAULT_TENANT_ID,
} from '@/application/order-service'
import type { CreateOrderDTO, ShippingInfo } from '@/domain/order'
import { notifyNewOrder } from '@/lib/slack'

/**
 * POST - 주문 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 유효성 검사
    if (!body.customerName || !body.customerPhone || !body.shippingInfo || !body.items?.length) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 배송 정보 유효성 검사
    const shippingInfo: ShippingInfo = body.shippingInfo
    if (!shippingInfo.recipientName || !shippingInfo.phone || !shippingInfo.address) {
      return NextResponse.json(
        { error: '배송 정보가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    const dto: CreateOrderDTO = {
      tenantId: body.tenantId || DEFAULT_TENANT_ID,
      userId: body.userId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      shippingInfo: shippingInfo,
      items: body.items,
    }

    const order = await createOrder(dto)

    // 슬랙 알림 발송 (비동기, 실패해도 주문 처리에 영향 없음)
    notifyNewOrder(
      order.orderNumber,
      order.customerName,
      order.totalAmount,
      order.items.length,
      shippingInfo.organizationName
    ).catch((err) => console.error('[Slack] 신규 주문 알림 실패:', err))

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    console.error('주문 생성 에러:', error)
    return NextResponse.json(
      { error: '주문 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET - 주문 목록 조회
 *
 * Query params:
 * - phone: 고객 전화번호 (고객용)
 * - userId: 로그인 사용자 ID (회원용)
 * - admin: true (관리자용 전체 조회)
 * - status: 주문 상태 필터
 * - detail: true (아이템 상세 포함)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')
    const userId = searchParams.get('userId')
    const isAdmin = searchParams.get('admin') === 'true'
    const status = searchParams.get('status')
    const detail = searchParams.get('detail') === 'true'

    if (isAdmin) {
      // 관리자용 전체 조회
      const orders = await getOrdersForAdmin({
        status: status as 'pending' | 'design_confirmed' | 'preparing' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | undefined,
      })

      return NextResponse.json({
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          shippingInfo: order.shippingInfo,
          items: order.items,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          totalAmount: order.totalAmount,
          status: order.status,
          adminMemo: order.adminMemo,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
      })
    }

    // 로그인 회원용 조회
    if (userId) {
      const orders = await getOrdersByUserId(userId)

      return NextResponse.json({
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          ...(detail && {
            items: order.items.map((item) => ({
              productName: item.productName,
              colorLabel: item.colorLabel,
              size: item.size,
              quantity: item.quantity,
            })),
          }),
        })),
      })
    }

    if (phone) {
      // 고객용 전화번호 조회
      const orders = await getOrdersByPhone(phone)

      return NextResponse.json({
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
          createdAt: order.createdAt,
        })),
      })
    }

    return NextResponse.json(
      { error: '전화번호 또는 사용자 ID를 입력해주세요.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('주문 조회 에러:', error)
    return NextResponse.json(
      { error: '주문 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}
