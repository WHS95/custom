/**
 * 슬랙 웹훅 알림 유틸리티
 * 주문 전 과정에서 슬랙 알림 발송
 */

import { ORDER_STATUS_LABELS, CARRIER_LABELS, type OrderStatus, type CarrierCode } from "@/domain/order/types"

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

export type SlackNotificationType =
  | 'new_order'         // 신규 주문
  | 'status_change'     // 상태 변경
  | 'shipped'           // 배송 출발
  | 'cancelled'         // 주문 취소

export interface SlackOrderPayload {
  type: SlackNotificationType
  orderNumber: string
  customerName: string
  organizationName?: string  // 단체명
  totalAmount?: number
  itemCount?: number
  status?: OrderStatus
  previousStatus?: OrderStatus
  trackingInfo?: { carrier: CarrierCode; trackingNumber: string }
  memo?: string
}

/**
 * 슬랙 메시지 블록 생성
 */
function buildSlackMessage(payload: SlackOrderPayload): string {
  const divider = "━━━━━━━━━━━━━━━━"
  const customerDisplay = payload.organizationName
    ? `${payload.customerName} (${payload.organizationName})`
    : payload.customerName

  switch (payload.type) {
    case 'new_order':
      return [
        "🆕 *신규 주문 접수*",
        divider,
        `📋 주문번호: ${payload.orderNumber}`,
        `👤 고객: ${customerDisplay}`,
        `💰 결제금액: ${payload.totalAmount?.toLocaleString()}원`,
        `📦 상품: ${payload.itemCount}개`,
        divider,
      ].join("\n")

    case 'status_change':
      const prevLabel = payload.previousStatus ? ORDER_STATUS_LABELS[payload.previousStatus] : "없음"
      const currLabel = payload.status ? ORDER_STATUS_LABELS[payload.status] : "없음"
      const lines = [
        "🔄 *주문 상태 변경*",
        divider,
        `📋 주문번호: ${payload.orderNumber}`,
        `👤 고객: ${customerDisplay}`,
        `📌 상태: ${prevLabel} → ${currLabel}`,
      ]
      if (payload.memo) {
        lines.push(`📝 메모: ${payload.memo}`)
      }
      lines.push(divider)
      return lines.join("\n")

    case 'shipped':
      const carrierLabel = payload.trackingInfo?.carrier
        ? CARRIER_LABELS[payload.trackingInfo.carrier]
        : "알 수 없음"
      return [
        "📦 *배송 출발*",
        divider,
        `📋 주문번호: ${payload.orderNumber}`,
        `👤 고객: ${customerDisplay}`,
        `🚚 택배사: ${carrierLabel}`,
        `🔢 송장번호: ${payload.trackingInfo?.trackingNumber || "-"}`,
        divider,
      ].join("\n")

    case 'cancelled':
      const cancelLines = [
        "❌ *주문 취소*",
        divider,
        `📋 주문번호: ${payload.orderNumber}`,
        `👤 고객: ${customerDisplay}`,
      ]
      if (payload.memo) {
        cancelLines.push(`📝 사유: ${payload.memo}`)
      }
      cancelLines.push(divider)
      return cancelLines.join("\n")

    default:
      return `📢 주문 알림: ${payload.orderNumber}`
  }
}

/**
 * 슬랙 웹훅 알림 발송
 * @param payload 알림 페이로드
 * @returns 성공 여부
 */
export async function sendSlackNotification(payload: SlackOrderPayload): Promise<boolean> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn("[Slack] SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.")
    return false
  }

  try {
    const message = buildSlackMessage(payload)

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: message }),
    })

    if (!response.ok) {
      console.error("[Slack] 알림 발송 실패:", response.status, response.statusText)
      return false
    }

    console.log("[Slack] 알림 발송 성공:", payload.type, payload.orderNumber)
    return true
  } catch (error) {
    console.error("[Slack] 알림 발송 중 에러:", error)
    return false
  }
}

/**
 * 신규 주문 알림 헬퍼
 */
export async function notifyNewOrder(
  orderNumber: string,
  customerName: string,
  totalAmount: number,
  itemCount: number,
  organizationName?: string
): Promise<boolean> {
  return sendSlackNotification({
    type: 'new_order',
    orderNumber,
    customerName,
    organizationName,
    totalAmount,
    itemCount,
  })
}

/**
 * 상태 변경 알림 헬퍼
 */
export async function notifyStatusChange(
  orderNumber: string,
  customerName: string,
  previousStatus: OrderStatus,
  newStatus: OrderStatus,
  memo?: string,
  organizationName?: string
): Promise<boolean> {
  // 취소인 경우 별도 타입 사용
  if (newStatus === 'cancelled') {
    return sendSlackNotification({
      type: 'cancelled',
      orderNumber,
      customerName,
      organizationName,
      memo,
    })
  }

  return sendSlackNotification({
    type: 'status_change',
    orderNumber,
    customerName,
    organizationName,
    previousStatus,
    status: newStatus,
    memo,
  })
}

/**
 * 배송 출발 알림 헬퍼
 */
export async function notifyShipped(
  orderNumber: string,
  customerName: string,
  carrier: CarrierCode,
  trackingNumber: string,
  organizationName?: string
): Promise<boolean> {
  return sendSlackNotification({
    type: 'shipped',
    orderNumber,
    customerName,
    organizationName,
    trackingInfo: { carrier, trackingNumber },
  })
}
