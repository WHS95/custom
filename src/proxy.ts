/**
 * Next.js Proxy
 *
 * 커스텀 세션 쿠키 기반 보호 라우트 처리
 */

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { hashSessionToken, AUTH_SESSION_COOKIE } from "@/lib/auth/session";

// 인증이 필요한 경로 패턴
const PROTECTED_ROUTES = ["/mypage", "/cart"];

// 인증된 사용자가 접근하면 안 되는 경로 (회원가입 등)
const AUTH_ROUTES = ["/signup", "/login"];

function getAuthClient() {
  return createClient<Database, "runhousecustom">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: "runhousecustom" },
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get(AUTH_SESSION_COOKIE)?.value;
  let hasSession = false;

  if (token) {
    try {
      const supabase = getAuthClient();
      const { data } = await supabase
        .from("customer_auth_sessions")
        .select("id")
        .eq("token_hash", hashSessionToken(token))
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      hasSession = !!data;
    } catch (error) {
      console.error("프록시 세션 조회 에러:", error);
    }
  }

  // 보호된 라우트 체크
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // 인증 라우트 체크
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 보호된 라우트에 비로그인 접근 시 로그인 페이지로 리다이렉트
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시 홈으로 리다이렉트
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로에 매치:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더의 파일들
     * - api 경로는 별도로 처리
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
