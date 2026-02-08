import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";

/**
 * 이메일 중복 체크 API
 * POST /api/auth/check-email
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 },
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    // Service Role 클라이언트로 auth.users 조회
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error("이메일 체크 에러:", error);
      return NextResponse.json(
        { error: "이메일 확인 중 오류가 발생했습니다." },
        { status: 500 },
      );
    }

    // 이메일이 이미 존재하는지 확인
    const exists = data.users.some(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    return NextResponse.json({
      available: !exists,
      exists,
    });
  } catch (error) {
    console.error("이메일 체크 예외:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
