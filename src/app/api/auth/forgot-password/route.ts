import { NextRequest, NextResponse } from "next/server";
import {
  createPasswordResetTokenForUser,
  findAuthUserByEmail,
} from "@/lib/auth/server-auth";
import { normalizeEmail } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일을 입력해주세요." },
        { status: 400 },
      );
    }

    const user = await findAuthUserByEmail(email);

    if (!user) {
      return NextResponse.json({
        success: true,
      });
    }

    const { token } = await createPasswordResetTokenForUser(user.id);
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
    const previewUrl = origin
      ? `${origin}/reset-password?token=${encodeURIComponent(token)}`
      : undefined;

    if (previewUrl) {
      console.log("[Auth] password reset link:", previewUrl);
    }

    return NextResponse.json({
      success: true,
      previewUrl: process.env.NODE_ENV !== "production" ? previewUrl : undefined,
    });
  } catch (error) {
    console.error("비밀번호 재설정 요청 에러:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 요청에 실패했습니다." },
      { status: 500 },
    );
  }
}
