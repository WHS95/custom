/**
 * Supabase 주문 레포지토리 구현
 */

import { createServerSupabaseClient, getSupabaseClient } from './client'
import type { IOrderRepository } from '@/domain/order/repository'
import type {
  Order,
  OrderItem,
  OrderFilter,
  CreateOrderDTO,
  UpdateOrderStatusDTO,
  OrderStatusHistory,
  ShippingInfo,
  DesignLayerSnapshot,
  OrderStatus,
  TrackingInfo,
} from '@/domain/order/types'

/**
 * Supabase 주문 레포지토리
 * 참고: 스키마 타입 정의 문제로 any 타입 사용
 */
export class SupabaseOrderRepository implements IOrderRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null
  private useServer = false

  /**
   * 클라이언트 가져오기
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getClient(): any {
    if (this.client) return this.client

    if (this.useServer) {
      return createServerSupabaseClient()
    }

    return getSupabaseClient()
  }

  /**
   * 서버 사이드에서 사용할 때 서비스 역할 클라이언트로 전환
   */
  useServerClient(): this {
    this.useServer = true
    this.client = null
    return this
  }

  /**
   * 주문 생성
   */
  async create(dto: CreateOrderDTO): Promise<Order> {
    const client = this.getClient()

    // 1. 주문번호 생성
    const { data: orderNumberResult, error: rpcError } = await client
      .rpc('generate_order_number', { p_tenant_id: dto.tenantId })

    let orderNumber: string
    if (rpcError) {
      console.error('주문번호 생성 RPC 에러:', rpcError)
      // RPC가 없으면 직접 생성
      const date = new Date()
      const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      orderNumber = `RH-${dateStr}-${random}`
    } else {
      orderNumber = orderNumberResult as string
    }

    // 2. 상품 합계 계산
    const subtotal = dto.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )

    // 3. 배송비 계산 (5만원 이상 무료)
    const shippingCost = subtotal >= 50000 ? 0 : 3000
    const totalAmount = subtotal + shippingCost

    // 4. 주문 생성
    const { data: order, error: orderError } = await client
      .from('orders')
      .insert({
        order_number: orderNumber,
        tenant_id: dto.tenantId,
        customer_name: dto.customerName,
        customer_phone: dto.customerPhone,
        customer_email: dto.customerEmail || null,
        shipping_info: dto.shippingInfo as unknown as Record<string, unknown>,
        subtotal,
        shipping_cost: shippingCost,
        total_amount: totalAmount,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`주문 생성 실패: ${orderError.message}`)
    }

    // 5. 주문 아이템 생성
    const orderItems = dto.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      color: item.color,
      color_label: item.colorLabel,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
      design_snapshot: item.designLayers as unknown as Record<string, unknown>,
    }))

    const { error: itemsError } = await client
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      throw new Error(`주문 아이템 생성 실패: ${itemsError.message}`)
    }

    // 6. 최초 상태 이력 생성
    await client.from('order_status_history').insert({
      order_id: order.id,
      from_status: null,
      to_status: 'pending',
      changed_by: 'system',
      memo: '주문 접수',
    })

    return this.mapToOrder(order)
  }

  /**
   * ID로 주문 조회
   */
  async findById(id: string): Promise<Order | null> {
    const client = this.getClient()

    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', id)
      .single()

    if (error || !data) return null
    return this.mapToOrderWithItems(data)
  }

  /**
   * 주문번호로 조회
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const client = this.getClient()

    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('order_number', orderNumber)
      .single()

    if (error || !data) return null
    return this.mapToOrderWithItems(data)
  }

  /**
   * 고객 전화번호로 주문 목록 조회
   */
  async findByCustomerPhone(tenantId: string, phone: string): Promise<Order[]> {
    const client = this.getClient()

    const { data, error } = await client
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('tenant_id', tenantId)
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((order: any) => this.mapToOrderWithItems(order))
  }

  /**
   * 필터로 주문 목록 조회
   */
  async findAll(filter: OrderFilter): Promise<Order[]> {
    const client = this.getClient()

    let query = client
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('tenant_id', filter.tenantId)

    if (filter.status) {
      query = query.eq('status', filter.status)
    }

    if (filter.customerPhone) {
      query = query.eq('customer_phone', filter.customerPhone)
    }

    if (filter.orderNumber) {
      query = query.ilike('order_number', `%${filter.orderNumber}%`)
    }

    if (filter.dateFrom) {
      query = query.gte('created_at', filter.dateFrom.toISOString())
    }

    if (filter.dateTo) {
      query = query.lte('created_at', filter.dateTo.toISOString())
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error || !data) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((order: any) => this.mapToOrderWithItems(order))
  }

  /**
   * 주문 상태 업데이트
   */
  async updateStatus(dto: UpdateOrderStatusDTO): Promise<Order> {
    const client = this.getClient()

    // 1. 현재 상태 조회
    const { data: currentOrder } = await client
      .from('orders')
      .select('status')
      .eq('id', dto.orderId)
      .single()

    const fromStatus = currentOrder?.status as OrderStatus | null

    // 2. 상태 업데이트
    const { data, error } = await client
      .from('orders')
      .update({ status: dto.status })
      .eq('id', dto.orderId)
      .select(`
        *,
        order_items (*)
      `)
      .single()

    if (error) {
      throw new Error(`상태 업데이트 실패: ${error.message}`)
    }

    // 3. 상태 이력 추가
    await client.from('order_status_history').insert({
      order_id: dto.orderId,
      from_status: fromStatus,
      to_status: dto.status,
      changed_by: dto.changedBy,
      memo: dto.memo || null,
    })

    return this.mapToOrderWithItems(data)
  }

  /**
   * 관리자 메모 업데이트
   */
  async updateAdminMemo(orderId: string, memo: string): Promise<Order> {
    const client = this.getClient()

    const { data, error } = await client
      .from('orders')
      .update({ admin_memo: memo })
      .eq('id', orderId)
      .select(`
        *,
        order_items (*)
      `)
      .single()

    if (error) {
      throw new Error(`메모 업데이트 실패: ${error.message}`)
    }

    return this.mapToOrderWithItems(data)
  }

  /**
   * 배송 추적 정보 업데이트
   */
  async updateTrackingInfo(orderId: string, trackingInfo: TrackingInfo): Promise<Order> {
    const client = this.getClient()

    const { data, error } = await client
      .from('orders')
      .update({ tracking_info: trackingInfo as unknown as Record<string, unknown> })
      .eq('id', orderId)
      .select(`
        *,
        order_items (*)
      `)
      .single()

    if (error) {
      throw new Error(`배송 정보 업데이트 실패: ${error.message}`)
    }

    return this.mapToOrderWithItems(data)
  }

  /**
   * 상태 이력 조회
   */
  async getStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    const client = this.getClient()

    const { data, error } = await client
      .from('order_status_history')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error || !data) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((h: any) => ({
      id: h.id,
      orderId: h.order_id,
      fromStatus: h.from_status as OrderStatus | null,
      toStatus: h.to_status as OrderStatus,
      changedBy: h.changed_by,
      memo: h.memo || undefined,
      createdAt: new Date(h.created_at),
    }))
  }

  /**
   * 오늘 주문 수 조회
   */
  async getTodayOrderCount(tenantId: string): Promise<number> {
    const client = this.getClient()

    const { data } = await client.rpc('get_today_order_count', {
      p_tenant_id: tenantId,
    })
    return (data as number) || 0
  }

  // ============================================
  // Private Methods - Mapping
  // ============================================

  private mapToOrder(row: Record<string, unknown>): Order {
    return {
      id: row.id as string,
      orderNumber: row.order_number as string,
      tenantId: row.tenant_id as string,
      customerId: row.customer_id as string | undefined,
      customerName: row.customer_name as string,
      customerPhone: row.customer_phone as string,
      customerEmail: row.customer_email as string | undefined,
      items: [],
      shippingInfo: row.shipping_info as ShippingInfo,
      subtotal: row.subtotal as number,
      shippingCost: row.shipping_cost as number,
      totalAmount: row.total_amount as number,
      status: row.status as OrderStatus,
      statusHistory: [],
      adminMemo: row.admin_memo as string | undefined,
      trackingInfo: row.tracking_info as TrackingInfo | undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }
  }

  private mapToOrderWithItems(
    row: Record<string, unknown> & { order_items?: Record<string, unknown>[] }
  ): Order {
    const order = this.mapToOrder(row)
    order.items = (row.order_items || []).map((item) => this.mapToOrderItem(item))
    return order
  }

  private mapToOrderItem(row: Record<string, unknown>): OrderItem {
    return {
      id: row.id as string,
      orderId: row.order_id as string,
      productId: row.product_id as string,
      productName: row.product_name as string,
      color: row.color as string,
      colorLabel: row.color_label as string,
      size: row.size as string,
      quantity: row.quantity as number,
      unitPrice: row.unit_price as number,
      totalPrice: row.total_price as number,
      designSnapshot: row.design_snapshot as DesignLayerSnapshot[],
    }
  }
}

// 싱글톤 인스턴스
export const orderRepository = new SupabaseOrderRepository()
