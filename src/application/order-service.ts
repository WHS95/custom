/**
 * 주문 서비스 (Application Layer)
 *
 * 유스케이스 처리 및 비즈니스 로직 조율
 */

import { orderRepository } from '@/infrastructure/supabase'
import type {
  Order,
  OrderFilter,
  CreateOrderDTO,
  UpdateOrderStatusDTO,
  OrderStatus,
  OrderStatusHistory,
} from '@/domain/order'

// 런하우스 기본 테넌트 ID
export const DEFAULT_TENANT_ID = 'a0000000-0000-0000-0000-000000000001'

/**
 * 주문 생성
 */
export async function createOrder(dto: CreateOrderDTO): Promise<Order> {
  // 서버 클라이언트 사용
  const repo = orderRepository.useServerClient()
  return repo.create(dto)
}

/**
 * 주문번호로 조회
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  return orderRepository.findByOrderNumber(orderNumber)
}

/**
 * 고객 전화번호로 주문 목록 조회
 */
export async function getOrdersByPhone(
  phone: string,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<Order[]> {
  return orderRepository.findByCustomerPhone(tenantId, phone)
}

/**
 * 관리자용 주문 목록 조회
 */
export async function getOrdersForAdmin(
  filter: Partial<OrderFilter>,
  tenantId: string = DEFAULT_TENANT_ID
): Promise<Order[]> {
  const repo = orderRepository.useServerClient()
  return repo.findAll({
    tenantId,
    ...filter,
  })
}

/**
 * 주문 상태 업데이트
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  changedBy: string,
  memo?: string
): Promise<Order> {
  const repo = orderRepository.useServerClient()
  return repo.updateStatus({
    orderId,
    status,
    changedBy,
    memo,
  })
}

/**
 * 관리자 메모 업데이트
 */
export async function updateAdminMemo(
  orderId: string,
  memo: string
): Promise<Order> {
  const repo = orderRepository.useServerClient()
  return repo.updateAdminMemo(orderId, memo)
}

/**
 * 주문 상태 이력 조회
 */
export async function getOrderStatusHistory(
  orderId: string
): Promise<OrderStatusHistory[]> {
  return orderRepository.getStatusHistory(orderId)
}

/**
 * 주문 상태별 통계 (관리자 대시보드용)
 */
export async function getOrderStats(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<Record<OrderStatus, number>> {
  const repo = orderRepository.useServerClient()

  const statuses: OrderStatus[] = [
    'pending',
    'design_confirmed',
    'preparing',
    'in_production',
    'shipped',
    'delivered',
    'cancelled',
  ]

  const stats: Record<OrderStatus, number> = {} as Record<OrderStatus, number>

  for (const status of statuses) {
    const orders = await repo.findAll({ tenantId, status })
    stats[status] = orders.length
  }

  return stats
}
