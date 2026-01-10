/**
 * 주문 상세 API 라우트
 *
 * GET /api/orders/[orderNumber] - 주문 상세 조회
 * PATCH /api/orders/[orderNumber] - 주문 상태/메모 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getOrderByNumber,
  updateOrderStatus,
  updateAdminMemo,
  updateOrderInfo,
  getOrderStatusHistory,
} from '@/application/order-service'
import { ORDER_STATUS_LABELS, type OrderStatus, type ShippingInfo } from '@/domain/order'
import { notifyStatusChange } from '@/lib/slack'

interface RouteParams {
  params: Promise<{ orderNumber: string }>
}

/**
 * GET - 주문 상세 조회
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = await params
    const order = await getOrderByNumber(orderNumber)

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 상태 이력 조회
    const statusHistory = await getOrderStatusHistory(order.id)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        shippingInfo: order.shippingInfo,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          color: item.color,
          colorLabel: item.colorLabel,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          designSnapshot: item.designSnapshot,
        })),
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        totalAmount: order.totalAmount,
        status: order.status,
        statusLabel: ORDER_STATUS_LABELS[order.status],
        adminMemo: order.adminMemo,
        statusHistory: statusHistory.map((h) => ({
          id: h.id,
          fromStatus: h.fromStatus,
          fromStatusLabel: h.fromStatus ? ORDER_STATUS_LABELS[h.fromStatus] : null,
          toStatus: h.toStatus,
          toStatusLabel: ORDER_STATUS_LABELS[h.toStatus],
          changedBy: h.changedBy,
          memo: h.memo,
          createdAt: h.createdAt,
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    })
  } catch (error) {
    console.error('주문 상세 조회 에러:', error)
    return NextResponse.json(
      { error: '주문 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - 주문 상태/메모 업데이트 (관리자용)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = await params
    const body = await request.json()

    // 기존 주문 조회
    const existingOrder = await getOrderByNumber(orderNumber)
    if (!existingOrder) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    let updatedOrder = existingOrder

    // 상태 업데이트
    if (body.status) {
      const validStatuses: OrderStatus[] = [
        'pending',
        'design_confirmed',
        'preparing',
        'in_production',
        'shipped',
        'delivered',
        'cancelled',
      ]

      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: '올바르지 않은 상태입니다.' },
          { status: 400 }
        )
      }

      updatedOrder = await updateOrderStatus(
        existingOrder.id,
        body.status,
        body.changedBy || 'admin',
        body.statusMemo
      )

      // 슬랙 알림 발송 (비동기, 실패해도 주문 처리에 영향 없음)
      notifyStatusChange(
        existingOrder.orderNumber,
        existingOrder.customerName,
        existingOrder.status,
        body.status,
        body.statusMemo,
        existingOrder.shippingInfo?.organizationName
      ).catch((err) => console.error('[Slack] 상태 변경 알림 실패:', err))
    }

    // 관리자 메모 업데이트
    if (body.adminMemo !== undefined) {
      updatedOrder = await updateAdminMemo(existingOrder.id, body.adminMemo)
    }

    // 고객정보/배송정보 업데이트
    const orderInfoUpdates: {
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      shippingInfo?: ShippingInfo
    } = {}

    if (body.customerName !== undefined) {
      orderInfoUpdates.customerName = body.customerName
    }
    if (body.customerPhone !== undefined) {
      orderInfoUpdates.customerPhone = body.customerPhone
    }
    if (body.customerEmail !== undefined) {
      orderInfoUpdates.customerEmail = body.customerEmail
    }
    if (body.shippingInfo !== undefined) {
      orderInfoUpdates.shippingInfo = body.shippingInfo as ShippingInfo
    }

    if (Object.keys(orderInfoUpdates).length > 0) {
      updatedOrder = await updateOrderInfo(existingOrder.id, orderInfoUpdates)
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        statusLabel: ORDER_STATUS_LABELS[updatedOrder.status],
        adminMemo: updatedOrder.adminMemo,
        updatedAt: updatedOrder.updatedAt,
      },
    })
  } catch (error) {
    console.error('주문 업데이트 에러:', error)
    return NextResponse.json(
      { error: '주문 업데이트에 실패했습니다.' },
      { status: 500 }
    )
  }
}
