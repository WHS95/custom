/**
 * GET /api/sso/initiate
 *
 * "크루로 로그인" 진입점.
 * 랜덤 state를 생성·httpOnly 쿠키에 저장하고
 * IdP /sso/authorize 로 302 리다이렉트합니다.
 */
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

const SSO_STATE_COOKIE = "sso_state";
const SSO_STATE_TTL_SECONDS = 300; // 5분 — 토큰 TTL(60s)보다 넉넉하게

export async function GET() {
  const idpBaseUrl = process.env.NEXT_PUBLIC_SSO_IDP_URL;
  if (!idpBaseUrl) {
    return NextResponse.json(
      { error: "SSO IdP URL이 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://runhouse-custom.vercel.app";
  const redirectUri = `${siteUrl}/sso/callback`;
  const state = randomBytes(16).toString("hex");

  const authorizeUrl = new URL(`${idpBaseUrl}/sso/authorize`);
  authorizeUrl.searchParams.set("client_id", "custom_hat");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set(SSO_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SSO_STATE_TTL_SECONDS,
  });

  return response;
}

export { SSO_STATE_COOKIE };
