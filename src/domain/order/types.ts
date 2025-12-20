/**
 * 주문 도메인 모델 (DDD)
 *
 * 멀티테넌트 확장 가능 구조
 * - Tenant: 커스텀 업체 (런하우스, 다른 업체 등)
 * - Order: 주문
 * - OrderItem: 주문 아이템
 * - Customer: 고객 정보
 * - ShippingInfo: 배송 정보
 * - DesignSnapshot: 디자인 스냅샷
 */

// ============================================
// 값 객체 (Value Objects)
// ============================================

/**
 * 주문 상태
 */
export type OrderStatus =
  | 'pending'           // 주문 접수
  | 'design_confirmed'  // 디자인 확정
  | 'preparing'         // 제작 준비
  | 'in_production'     // 제작 진행
  | 'shipped'           // 배송 중
  | 'delivered'         // 배송 완료
  | 'cancelled'         // 주문 취소

/**
 * 주문 상태 한글 라벨
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '주문 접수',
  design_confirmed: '디자인 확정',
  preparing: '제작 준비',
  in_production: '제작 진행',
  shipped: '배송 중',
  delivered: '배송 완료',
  cancelled: '주문 취소',
}

/**
 * 주문 상태 순서 (진행률 계산용)
 */
export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'pending',
  'design_confirmed',
  'preparing',
  'in_production',
  'shipped',
  'delivered',
]

// ============================================
// 엔티티 (Entities)
// ============================================

/**
 * 테넌트 (커스텀 업체)
 * 멀티테넌트 지원을 위한 엔티티
 */
export interface Tenant {
  id: string
  name: string              // 업체명
  slug: string              // URL용 슬러그 (예: runhouse, custom-shop)
  logoUrl?: string
  contactEmail: string
  contactPhone?: string
  settings: TenantSettings
  createdAt: Date
  updatedAt: Date
}

export interface TenantSettings {
  basePrice: number           // 기본 상품 가격
  shippingFreeThreshold: number  // 무료배송 기준 금액
  shippingCost: number        // 배송비
  currency: 'KRW' | 'USD'
}

/**
 * 고객 정보
 */
export interface Customer {
  id: string
  tenantId: string           // 소속 테넌트
  name: string               // 고객명
  email?: string
  phone: string              // 연락처 (필수)
  organizationName?: string  // 단체명 (선택)
  createdAt: Date
  updatedAt: Date
}

/**
 * 배송 정보 (값 객체)
 */
export interface ShippingInfo {
  recipientName: string      // 수령인명
  phone: string              // 연락처
  zipCode: string            // 우편번호
  address: string            // 주소
  addressDetail: string      // 상세주소
  organizationName?: string  // 단체명 (선택)
  memo?: string              // 배송 메모
}

/**
 * 디자인 스냅샷 (주문 시점의 디자인 저장)
 */
export interface DesignSnapshot {
  id: string
  layers: DesignLayerSnapshot[]
  createdAt: Date
}

export interface DesignLayerSnapshot {
  id: string
  type: 'image' | 'text'
  content: string            // Base64 또는 텍스트
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  view: 'front' | 'back' | 'left' | 'right' | 'top'
  color?: string
}

/**
 * 주문 아이템
 */
export interface OrderItem {
  id: string
  orderId: string
  productId: string          // 상품 ID
  productName: string        // 상품명
  color: string              // 색상 ID
  colorLabel: string         // 색상 라벨
  size: string               // 사이즈
  quantity: number           // 수량
  unitPrice: number          // 단가
  totalPrice: number         // 소계 (단가 * 수량)
  designSnapshot: DesignLayerSnapshot[]  // 디자인 스냅샷
}

/**
 * 주문 (Aggregate Root)
 */
export interface Order {
  id: string
  orderNumber: string        // 주문번호 (예: RH-20241219-001)
  tenantId: string           // 소속 테넌트

  // 고객 정보
  customerId?: string        // 고객 ID (회원인 경우)
  customerName: string       // 주문자명
  customerPhone: string      // 주문자 연락처
  customerEmail?: string     // 주문자 이메일

  // 주문 아이템
  items: OrderItem[]

  // 배송 정보
  shippingInfo: ShippingInfo

  // 금액 정보
  subtotal: number           // 상품 합계
  shippingCost: number       // 배송비
  totalAmount: number        // 총 결제금액

  // 상태 정보
  status: OrderStatus
  statusHistory: OrderStatusHistory[]

  // 관리자 메모
  adminMemo?: string

  // 타임스탬프
  createdAt: Date
  updatedAt: Date
}

/**
 * 주문 상태 변경 이력
 */
export interface OrderStatusHistory {
  id: string
  orderId: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  changedBy: string          // 변경자 (admin/system)
  memo?: string              // 메모
  createdAt: Date
}

// ============================================
// DTO (Data Transfer Objects)
// ============================================

/**
 * 주문 생성 DTO
 */
export interface CreateOrderDTO {
  tenantId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  shippingInfo: ShippingInfo
  items: CreateOrderItemDTO[]
}

export interface CreateOrderItemDTO {
  productId: string
  productName: string
  color: string
  colorLabel: string
  size: string
  quantity: number
  unitPrice: number
  designLayers: DesignLayerSnapshot[]
}

/**
 * 주문 상태 업데이트 DTO
 */
export interface UpdateOrderStatusDTO {
  orderId: string
  status: OrderStatus
  changedBy: string
  memo?: string
}

/**
 * 주문 조회 필터
 */
export interface OrderFilter {
  tenantId: string
  status?: OrderStatus
  customerPhone?: string
  orderNumber?: string
  dateFrom?: Date
  dateTo?: Date
}

// ============================================
// 주문번호 생성 유틸리티
// ============================================

/**
 * 주문번호 생성
 * 형식: {테넌트약자}-{날짜}-{순번}
 * 예: RH-20241219-001
 */
export function generateOrderNumber(tenantSlug: string, sequence: number): string {
  const prefix = tenantSlug.toUpperCase().slice(0, 2)
  const date = new Date()
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const seq = String(sequence).padStart(3, '0')
  return `${prefix}-${dateStr}-${seq}`
}

/**
 * 주문 진행률 계산 (%)
 */
export function calculateOrderProgress(status: OrderStatus): number {
  if (status === 'cancelled') return 0
  const index = ORDER_STATUS_ORDER.indexOf(status)
  if (index === -1) return 0
  return Math.round((index / (ORDER_STATUS_ORDER.length - 1)) * 100)
}
