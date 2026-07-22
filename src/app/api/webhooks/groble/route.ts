/**
 * 그로블(Groble) 결제 웹훅 수신
 * POST /api/webhooks/groble
 *
 * - X-Groble-Signature: HEX(HMAC-SHA256(secret, "{timestamp}.{raw_body}")) 검증
 * - X-Groble-Idempotency-Key 로 멱등 처리
 * - payment.completed → 미결제 주문을 전화번호+금액으로 매칭해 결제 완료 처리
 *
 * 설정: 그로블 스토어 설정 > 웹훅에 이 URL 등록 후
 * 발급된 시크릿을 GROBLE_WEBHOOK_SECRET 환경변수에 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import type { Json } from "@/infrastructure/supabase/database.types";
import { notifyText } from "@/lib/slack";

const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000; // ±5분

function safeEqualHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

function verifySignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string | null,
  previousSignature: string | null,
): boolean {
  if (!signature && !previousSignature) return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  if (signature && safeEqualHex(expected, signature)) return true;
  // 시크릿 로테이션 기간: 이전 서명도 허용
  if (previousSignature && safeEqualHex(expected, previousSignature)) return true;
  return false;
}

/** 페이로드 어디에 있든 전화번호/금액 후보를 방어적으로 추출 */
function extractFields(payload: Record<string, unknown>): {
  phone: string | null;
  amount: number | null;
} {
  let phone: string | null = null;
  let amount: number | null = null;

  const visit = (obj: unknown) => {
    if (!obj || typeof obj !== "object") return;
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lower = key.toLowerCase();
      if (
        !phone &&
        typeof value === "string" &&
        (lower.includes("phone") || lower.includes("contact"))
      ) {
        const digits = value.replace(/\D/g, "");
        if (digits.length >= 9) phone = digits;
      }
      if (
        amount === null &&
        typeof value === "number" &&
        (lower === "totalamount" ||
          lower === "totalprice" ||
          lower === "amount" ||
          lower === "paidamount" ||
          lower === "finalprice")
      ) {
        amount = value;
      }
      if (typeof value === "object") visit(value);
    }
  };
  visit(payload);
  return { phone, amount };
}

export async function POST(request: NextRequest) {
  const secret = process.env.GROBLE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Groble] GROBLE_WEBHOOK_SECRET 미설정");
    return NextResponse.json({ error: "not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const timestamp = request.headers.get("x-groble-timestamp") || "";
  const signature = request.headers.get("x-groble-signature");
  const previousSignature = request.headers.get("x-groble-signature-previous");
  const idempotencyKey = request.headers.get("x-groble-idempotency-key");

  // 타임스탬프 ±5분 검증 (리플레이 방지)
  const ts = Number(timestamp);
  const tsMs = ts > 1e12 ? ts : ts * 1000; // 초/밀리초 모두 허용
  if (!ts || Math.abs(Date.now() - tsMs) > TIMESTAMP_TOLERANCE_MS) {
    return NextResponse.json({ error: "invalid timestamp" }, { status: 401 });
  }

  if (!verifySignature(secret, timestamp, rawBody, signature, previousSignature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const eventType = typeof payload.type === "string" ? payload.type : "unknown";
  const eventId = typeof payload.id === "string" ? payload.id : null;
  const dedupeKey = idempotencyKey || eventId;
  if (!dedupeKey) {
    return NextResponse.json({ error: "missing idempotency key" }, { status: 400 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // 멱등 처리: 동일 키가 이미 있으면 성공으로 응답만
    const { error: insertError } = await supabase
      .from("groble_webhook_events")
      .insert({
        idempotency_key: dedupeKey,
        event_id: eventId,
        event_type: eventType,
        payload: payload as Json,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // unique violation → 이미 처리한 이벤트
        return NextResponse.json({ success: true, duplicate: true });
      }
      throw new Error(insertError.message);
    }

    if (eventType === "payment.completed") {
      const { phone, amount } = extractFields(payload);
      let matchedOrderNumber: string | null = null;

      if (phone && amount !== null) {
        // 미결제 주문 중 금액이 일치하는 최신 주문을 전화번호로 매칭
        const { data: candidates } = await supabase
          .from("orders")
          .select("id, order_number, customer_phone, total_amount")
          .eq("payment_status", "unpaid")
          .eq("total_amount", amount)
          .order("created_at", { ascending: false })
          .limit(20);

        const matched = (candidates || []).find(
          (o) => o.customer_phone.replace(/\D/g, "") === phone,
        );

        if (matched) {
          const occurredAt =
            typeof payload.occurredAt === "string"
              ? payload.occurredAt
              : new Date().toISOString();

          const { error: updateError } = await supabase
            .from("orders")
            .update({ payment_status: "paid", paid_at: occurredAt })
            .eq("id", matched.id)
            .eq("payment_status", "unpaid");

          if (!updateError) {
            matchedOrderNumber = matched.order_number;
            await supabase
              .from("groble_webhook_events")
              .update({ matched_order_id: matched.id, processed: true })
              .eq("idempotency_key", dedupeKey);
          }
        }
      }

      // 운영팀 알림 (실패해도 웹훅 처리에 영향 없음)
      notifyText(
        matchedOrderNumber
          ? `💳 그로블 결제 완료 — 주문 ${matchedOrderNumber} (${amount?.toLocaleString()}원) 결제 확인됨`
          : `💳 그로블 결제 수신 — 자동 매칭 실패 (금액 ${amount?.toLocaleString() ?? "?"}원, 전화 ${phone ?? "?"}). 관리자 확인 필요`,
      ).catch((err) => console.error("[Slack] 그로블 결제 알림 실패:", err));
    }

    if (
      eventType === "payment.cancel_requested" ||
      eventType === "subscription.cancel_requested"
    ) {
      notifyText(
        `⚠️ 그로블 결제 취소 요청 수신 — 관리자 확인 필요 (event: ${eventId ?? dedupeKey})`,
      ).catch((err) => console.error("[Slack] 그로블 취소 알림 실패:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/webhooks/groble error:", error);
    // 5xx 응답 시 그로블이 재시도
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
