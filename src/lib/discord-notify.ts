/**
 * Discord 웹훅 알림 유틸리티 (제작 가능 여부 확인 플로우)
 *
 * 채널 2개:
 * - 공장 채널(DISCORD_FACTORY_WEBHOOK_URL): 크루장이 제작 문의를 넣으면 시안+링크 전달
 * - 운영자 채널(DISCORD_OPERATOR_WEBHOOK_URL): 공장이 판정하면 결과 통지
 *
 * Discord 웹훅은 { content } 또는 { embeds } JSON을 POST하면 된다.
 * 실패해도 앱 흐름에 영향 없도록 조용히 로깅만 한다. (Slack 패턴과 동일)
 */

const FACTORY_WEBHOOK_URL = process.env.DISCORD_FACTORY_WEBHOOK_URL;
const OPERATOR_WEBHOOK_URL = process.env.DISCORD_OPERATOR_WEBHOOK_URL;

async function post(webhookUrl: string | undefined, content: string) {
  if (!webhookUrl) {
    console.warn("[Discord] 웹훅 URL 미설정 — 알림 생략");
    return false;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // content는 2000자 제한
      body: JSON.stringify({ content: content.slice(0, 1990) }),
    });
    if (!res.ok) {
      console.error("[Discord] 웹훅 응답 오류:", res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Discord] 웹훅 전송 실패:", err);
    return false;
  }
}

const DIVIDER = "━━━━━━━━━━━━━━━━";

/** SSO stub 이메일에서 인스타 핸들 추출: sso-{handle}@runhouse-sso.internal → @{handle} */
export function crewHandleFromEmail(email?: string | null): string | null {
  if (!email) return null;
  const m = email.match(/^sso-(.+)@runhouse-sso\.internal$/);
  return m ? `@${m[1]}` : null;
}

/** 요청자 식별 라인 (크루명 · 핸들 · 담당자 · 연락처) */
function requesterLines(p: {
  crewName: string;
  handle?: string | null;
  requesterName?: string | null;
  phone?: string | null;
}): string[] {
  const lines = [`🏃 크루: ${p.crewName}`];
  if (p.handle) lines.push(`📸 인스타: ${p.handle}`);
  if (p.requesterName && p.requesterName !== p.crewName)
    lines.push(`🙋 담당: ${p.requesterName}`);
  if (p.phone) lines.push(`📞 연락처: ${p.phone}`);
  return lines;
}

export interface FactoryReviewRequestPayload {
  crewName: string;
  handle?: string | null;
  requesterName?: string | null;
  phone?: string | null;
  productName: string;
  colorLabel: string;
  attachmentCount: number;
  note?: string;
  reviewUrl: string; // 공장 확인 링크 (토큰 포함)
}

/** 공장 채널: 신규 제작 문의 */
export async function notifyFactoryReviewRequest(
  p: FactoryReviewRequestPayload,
): Promise<boolean> {
  const lines = [
    "🧵 **제작 가능 여부 문의**",
    DIVIDER,
    ...requesterLines(p),
    `👕 상품: ${p.productName} · ${p.colorLabel}`,
    `📎 첨부: ${p.attachmentCount}개`,
    p.note ? `📝 요청: ${p.note}` : "",
    DIVIDER,
    `🔗 시안·첨부 확인 후 판정: ${p.reviewUrl}`,
  ].filter(Boolean);
  return post(FACTORY_WEBHOOK_URL, lines.join("\n"));
}

export interface CrewDiscountRequestPayload {
  crewName: string;
  instagram?: string | null;
  requesterName?: string | null;
  email: string;
  phone?: string | null;
  runhouseMapRegistered: boolean;
  approveUrl?: string; // 관리자 승인 페이지 링크
}

/** 운영자 채널: 신규 크루 할인 승인 요청 */
export async function notifyCrewDiscountRequest(
  p: CrewDiscountRequestPayload,
): Promise<boolean> {
  const handle = p.instagram
    ? p.instagram.startsWith("@")
      ? p.instagram
      : `@${p.instagram}`
    : null;
  const lines = [
    "🎟️ **크루 할인 승인 요청**",
    DIVIDER,
    `🏃 크루: ${p.crewName}`,
    handle ? `📸 인스타: ${handle}` : "",
    p.requesterName ? `🙋 담당: ${p.requesterName}` : "",
    `✉️ 이메일: ${p.email}`,
    p.phone ? `📞 연락처: ${p.phone}` : "",
    `🗺️ 런하우스크루맵 등록: ${p.runhouseMapRegistered ? "예 ✅" : "아니오 ❌"}`,
    DIVIDER,
    p.approveUrl ? `🔗 승인/거절: ${p.approveUrl}` : "👉 관리자 크루 승인 페이지에서 확인하세요",
  ].filter(Boolean);
  return post(OPERATOR_WEBHOOK_URL, lines.join("\n"));
}

export interface OperatorReviewResultPayload {
  crewName: string;
  handle?: string | null;
  requesterName?: string | null;
  phone?: string | null;
  productName: string;
  colorLabel: string;
  approved: boolean;
  factoryComment?: string;
}

/** 운영자 채널: 공장 판정 결과 */
export async function notifyOperatorReviewResult(
  p: OperatorReviewResultPayload,
): Promise<boolean> {
  const lines = [
    p.approved ? "✅ **제작 가능 — 승인**" : "🚫 **제작 불가 — 반려**",
    DIVIDER,
    ...requesterLines(p),
    `👕 상품: ${p.productName} · ${p.colorLabel}`,
    p.factoryComment ? `💬 공장 의견: ${p.factoryComment}` : "",
  ].filter(Boolean);
  return post(OPERATOR_WEBHOOK_URL, lines.join("\n"));
}
