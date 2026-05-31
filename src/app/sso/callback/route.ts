/**
 * GET /sso/callback?token=<jwt>&state=<state>
 *
 * SSO RP 콜백 처리 (§3 공통 규약 + §4 custom-hat 세부):
 *  1. state CSRF 검증
 *  2. JWT 검증 (HS256, iss, aud, exp)
 *  3. 크루 계정 upsert + 앱 세션 발급
 *  4. 홈으로 리다이렉트
 */
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySsoToken } from "@/lib/sso/verify-token";
import {
  upsertCrewAccountAndCreateSession,
  AUTH_SESSION_COOKIE,
  getSessionCookieOptions,
} from "@/lib/sso/crew-account";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";

const SSO_STATE_COOKIE = "sso_state";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://runhouse-custom.vercel.app";

function errorRedirect(message: string) {
  const url = new URL("/login", siteUrl);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url.toString());
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get("token");
  const stateParam = searchParams.get("state");

  if (!token || !stateParam) {
    return errorRedirect("sso_missing_params");
  }

  // 1. CSRF state 검증
  const cookieStore = await cookies();
  const storedState = cookieStore.get(SSO_STATE_COOKIE)?.value;

  if (!storedState || storedState !== stateParam) {
    return errorRedirect("sso_state_mismatch");
  }

  // state 쿠키 즉시 삭제 (일회성)
  const response_base = NextResponse.redirect(new URL("/", siteUrl));
  response_base.cookies.delete(SSO_STATE_COOKIE);

  // 2. JWT 검증
  let payload;
  try {
    payload = await verifySsoToken(token);
  } catch (err) {
    console.error("[SSO callback] JWT 검증 실패:", err);
    return errorRedirect("sso_token_invalid");
  }

  // 3. jti 단일 사용 검증 (replay 방지)
  const supabase = createServerSupabaseClient();
  const jti = payload.jti;
  const expTimestamp = payload.exp;
  // exp is Unix seconds → convert to ISO timestamptz for storage
  const expIso = new Date(expTimestamp * 1000).toISOString();

  const { error: jtiError } = await supabase.from("used_sso_tokens").insert({
    jti,
    aud: payload.aud,
    exp: expIso,
  });

  if (jtiError) {
    // Postgres unique-violation code 23505 → token already used
    if (
      typeof jtiError === "object" &&
      "code" in jtiError &&
      jtiError.code === "23505"
    ) {
      console.warn("[SSO callback] jti replay 감지:", jti);
      return errorRedirect("sso_token_replay");
    }
    console.error("[SSO callback] jti 저장 실패:", jtiError);
    return errorRedirect("sso_account_error");
  }

  // 4. 크루 계정 upsert + 앱 세션 발급
  let sessionToken: string;
  let expiresAt: Date;
  try {
    const result = await upsertCrewAccountAndCreateSession(payload);
    sessionToken = result.token;
    expiresAt = result.expiresAt;
  } catch (err) {
    console.error("[SSO callback] 크루 계정 처리 실패:", err);
    return errorRedirect("sso_account_error");
  }

  // 5. 앱 세션 쿠키 설정 후 홈으로 리다이렉트
  const finalResponse = NextResponse.redirect(new URL("/", siteUrl));
  finalResponse.cookies.delete(SSO_STATE_COOKIE);
  finalResponse.cookies.set(
    AUTH_SESSION_COOKIE,
    sessionToken,
    getSessionCookieOptions(expiresAt),
  );

  return finalResponse;
}
