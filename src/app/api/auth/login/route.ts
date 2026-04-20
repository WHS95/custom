import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  createSessionForUser,
  findAuthUserByEmail,
} from "@/lib/auth/server-auth";
import {
  getSessionCookieOptions,
  normalizeEmail,
  AUTH_SESSION_COOKIE,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 },
      );
    }

    const user = await findAuthUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const { token, expiresAt } = await createSessionForUser(user.id);
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      AUTH_SESSION_COOKIE,
      token,
      getSessionCookieOptions(expiresAt),
    );

    return response;
  } catch (error) {
    console.error("로그인 에러:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
