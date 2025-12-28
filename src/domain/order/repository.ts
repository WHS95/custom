/**
 * 주문 레포지토리 인터페이스 (DDD)
 *
 * 도메인 레이어에서 정의하고, 인프라 레이어에서 구현
 * 이를 통해 도메인 로직이 특정 DB에 종속되지 않음
 */

import {
  Order,
  OrderItem,
  OrderFilter,
  CreateOrderDTO,
  UpdateOrderStatusDTO,
  OrderStatusHistory,
  TrackingInfo,
} from './types'

/**
 * 주문 레포지토리 인터페이스
 */
export interface IOrderRepository {
  // 생성
  create(dto: CreateOrderDTO): Promise<Order>

  // 조회
  findById(id: string): Promise<Order | null>
  findByOrderNumber(orderNumber: string): Promise<Order | null>
  findByCustomerPhone(tenantId: string, phone: string): Promise<Order[]>
  findAll(filter: OrderFilter): Promise<Order[]>

  // 업데이트
  updateStatus(dto: UpdateOrderStatusDTO): Promise<Order>
  updateAdminMemo(orderId: string, memo: string): Promise<Order>
  updateTrackingInfo(orderId: string, trackingInfo: TrackingInfo): Promise<Order>

  // 상태 이력
  getStatusHistory(orderId: string): Promise<OrderStatusHistory[]>

  // 오늘 주문 수 (주문번호 생성용)
  getTodayOrderCount(tenantId: string): Promise<number>
}

/**
 * 주문 아이템 레포지토리 인터페이스
 */
export interface IOrderItemRepository {
  findByOrderId(orderId: string): Promise<OrderItem[]>
  create(orderId: string, items: OrderItem[]): Promise<OrderItem[]>
}
