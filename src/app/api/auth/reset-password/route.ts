import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  updateAuthUserPassword,
} from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json({ error: "재설정 토큰이 필요합니다." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    const resetToken = await getPasswordResetToken(token);

    if (!resetToken) {
      return NextResponse.json(
        { error: "유효하지 않거나 만료된 링크입니다." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateAuthUserPassword(resetToken.user_id, passwordHash);
    await markPasswordResetTokenUsed(resetToken.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("비밀번호 재설정 에러:", error);
    return NextResponse.json(
      { error: "비밀번호 재설정에 실패했습니다." },
      { status: 500 },
    );
  }
}
