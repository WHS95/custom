"use server";

/**
 * 인라인 크루 로그인 (백채널 SSO)
 *
 * 장바구니 등 인라인 폼에서 인스타 핸들 + PIN을 받아
 * IdP(RunningCrewMap) /api/sso/verify-pin 백채널 엔드포인트로 검증한다.
 * 성공 시 기존 리다이렉트 SSO와 동일한 파이프라인을 재사용한다:
 *   verifySsoToken → used_sso_tokens jti 단일 사용 → upsertCrewAccountAndCreateSession
 *   → AUTH_SESSION_COOKIE 설정
 *
 * 백채널 실패 시 fallback:true 를 반환하여 UI가 기존
 * /api/sso/initiate 리다이렉트 경로로 폴백할 수 있게 한다.
 *
 * ⚠️ PIN 이나 요청 본문은 절대 로깅하지 않는다.
 */
import { cookies } from "next/headers";
import { verifySsoToken } from "@/lib/sso/verify-token";
import {
  upsertCrewAccountAndCreateSession,
  AUTH_SESSION_COOKIE,
  getSessionCookieOptions,
} from "@/lib/sso/crew-account";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";

const CLIENT_ID = "custom_hat";

/** verify-pin 엔드포인트가 반환할 수 있는 실패 사유 */
type VerifyPinReason = "invalid" | "locked" | "no-pin" | "forbidden" | "bad-request";

/** 인라인 크루 로그인 결과 (UI에서 분기) */
export type CrewLoginInlineResult =
  | { ok: true }
  | { ok: false; reason: VerifyPinReason | "replay"; unlocksAt?: string }
  | { ok: false; reason: "backchannel_unavailable"; fallback: true };

interface VerifyPinResponse {
  ok: boolean;
  token?: string;
  reason?: VerifyPinReason;
  unlocksAt?: string;
}

/**
 * 인라인 크루 로그인 Server Action
 *
 * @param instagram 인스타 핸들 (@ 없이, 소문자 권장)
 * @param pin       4-8자리 PIN
 */
export async function crewLoginInline(
  instagram: string,
  pin: string,
): Promise<CrewLoginInlineResult> {
  const idpBaseUrl = process.env.NEXT_PUBLIC_SSO_IDP_URL;
  const backchannelSecret = process.env.RUNHOUSE_SSO_BACKCHANNEL_SECRET;

  // 환경 미설정 → 백채널 사용 불가 → 리다이렉트 폴백
  if (!idpBaseUrl || !backchannelSecret) {
    console.error(
      "[crewLoginInline] 백채널 환경변수 미설정 (IDP URL / BACKCHANNEL SECRET)",
    );
    return { ok: false, reason: "backchannel_unavailable", fallback: true };
  }

  const normalizedInstagram = instagram.trim().replace(/^@/, "").toLowerCase();

  // 1. IdP 백채널 호출 (서버 → 서버, 쿠키 없음)
  let res: Response;
  try {
    res = await fetch(`${idpBaseUrl}/api/sso/verify-pin`, {
      method: "POST",
      headers: {
        "X-SSO-Client-Secret": backchannelSecret,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        instagram: normalizedInstagram,
        pin,
      }),
      cache: "no-store",
    });
  } catch (err) {
    // 네트워크 장애 → 리다이렉트 폴백 (PIN/본문 로깅 금지)
    console.error("[crewLoginInline] 백채널 네트워크 오류:", err);
    return { ok: false, reason: "backchannel_unavailable", fallback: true };
  }

  // 백채널 자체가 5xx 등으로 깨졌으면 폴백
  if (res.status >= 500) {
    console.error("[crewLoginInline] 백채널 5xx 응답:", res.status);
    return { ok: false, reason: "backchannel_unavailable", fallback: true };
  }

  let data: VerifyPinResponse;
  try {
    data = (await res.json()) as VerifyPinResponse;
  } catch (err) {
    console.error("[crewLoginInline] 백채널 응답 파싱 실패:", err);
    return { ok: false, reason: "backchannel_unavailable", fallback: true };
  }

  // 2. 인증 실패 응답 처리 (401/403/400)
  if (!data.ok || !data.token) {
    const reason: VerifyPinReason = data.reason ?? "invalid";
    return { ok: false, reason, unlocksAt: data.unlocksAt };
  }

  const { token } = data;

  // 3. 기존 파이프라인 재사용 — JWT 검증
  let payload;
  try {
    payload = await verifySsoToken(token);
  } catch (err) {
    console.error("[crewLoginInline] JWT 검증 실패:", err);
    return { ok: false, reason: "invalid" };
  }

  // 4. jti 단일 사용 검증 (replay 방지) — /sso/callback 과 동일
  const supabase = createServerSupabaseClient();
  const expIso = new Date(payload.exp * 1000).toISOString();

  const { error: jtiError } = await supabase.from("used_sso_tokens").insert({
    jti: payload.jti,
    aud: payload.aud,
    exp: expIso,
  });

  if (jtiError) {
    if (
      typeof jtiError === "object" &&
      "code" in jtiError &&
      jtiError.code === "23505"
    ) {
      // Postgres unique-violation → 이미 사용된 토큰
      console.warn("[crewLoginInline] jti replay 감지");
      return { ok: false, reason: "replay" };
    }
    console.error("[crewLoginInline] jti 저장 실패:", jtiError);
    return { ok: false, reason: "invalid" };
  }

  // 5. 크루 계정 upsert + 앱 세션 발급
  let sessionToken: string;
  let expiresAt: Date;
  try {
    const result = await upsertCrewAccountAndCreateSession(payload);
    sessionToken = result.token;
    expiresAt = result.expiresAt;
  } catch (err) {
    console.error("[crewLoginInline] 크루 계정 처리 실패:", err);
    return { ok: false, reason: "invalid" };
  }

  // 6. 앱 세션 쿠키 설정
  const cookieStore = await cookies();
  cookieStore.set(
    AUTH_SESSION_COOKIE,
    sessionToken,
    getSessionCookieOptions(expiresAt),
  );

  return { ok: true };
}
