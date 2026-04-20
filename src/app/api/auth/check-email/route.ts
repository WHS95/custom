import { NextRequest, NextResponse } from "next/server";
import { findAuthUserByEmail } from "@/lib/auth/server-auth";
import { normalizeEmail } from "@/lib/auth/session";

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

    const existingUser = await findAuthUserByEmail(normalizeEmail(email));
    const exists = !!existingUser;

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
