/**
 * OAuth 콜백 라우트
 *
 * 카카오 등 OAuth 로그인 후 Supabase가 리다이렉트하는 엔드포인트
 * code를 세션으로 교환한 후, 프로필 유무에 따라 라우팅
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: CookieOptions;
          }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth 콜백 에러:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // 세션에서 유저 정보 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // runhousecustom 스키마에서 프로필 확인
  const { data: profile } = await supabase
    .schema("runhousecustom")
    .from("user_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    // 프로필 없음 → 온보딩 페이지로
    return NextResponse.redirect(`${origin}/onboarding`);
  }

  // 프로필 있음 → 원래 목적지로
  return NextResponse.redirect(`${origin}${next}`);
}
