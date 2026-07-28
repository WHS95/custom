import { NextRequest, NextResponse } from "next/server";
import {
  createPasswordResetTokenForUser,
  findAuthUserByEmail,
} from "@/lib/auth/server-auth";
import { normalizeEmail } from "@/lib/auth/session";
import { sendPasswordResetEmail } from "@/lib/auth-email";

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
    // 외부로 나가는 링크 베이스 URL은 SITE_URL 컨벤션 우선(요청 origin은 localhost 폴백)
    const base =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "https://runhouse-custom.vercel.app";
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

    if (process.env.NODE_ENV !== "production") {
      console.log("[Auth] password reset link:", resetUrl);
    }

    // 실제 메일 발송 (Edge Function). env 미설정 시 조용히 스킵 → 개발 previewUrl로 대체.
    await sendPasswordResetEmail(user.email, resetUrl);

    return NextResponse.json({
      success: true,
      previewUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
  } catch (error) {
    console.error("비밀번호 재설정 요청 에러:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정 요청에 실패했습니다." },
      { status: 500 },
    );
  }
}
