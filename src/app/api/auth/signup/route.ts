import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";
import {
  createAuthUser,
  createSessionForUser,
  deleteAuthUser,
  findAuthUserByEmail,
} from "@/lib/auth/server-auth";
import {
  AUTH_SESSION_COOKIE,
  getSessionCookieOptions,
  normalizeEmail,
} from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body.password === "string" ? body.password : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const userType =
      body.userType === "crew_pending" ||
      body.userType === "crew_staff" ||
      body.userType === "individual"
        ? body.userType
        : "individual";
    const crewName =
      typeof body.crewName === "string" && body.crewName.trim()
        ? body.crewName.trim()
        : null;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 형식이 아닙니다." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    const existingUser = await findAuthUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다." },
        { status: 409 },
      );
    }

    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    await createAuthUser({
      id: userId,
      email,
      passwordHash,
    });

    try {
      const supabase = createServerSupabaseClient();
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({
          user_id: userId,
          name,
          phone: "",
          user_type: userType,
          crew_name: crewName,
        });

      if (profileError) {
        throw profileError;
      }
    } catch (error) {
      await deleteAuthUser(userId);
      throw error;
    }

    const { token, expiresAt } = await createSessionForUser(userId);
    const response = NextResponse.json({ success: true });
    response.cookies.set(
      AUTH_SESSION_COOKIE,
      token,
      getSessionCookieOptions(expiresAt),
    );

    return response;
  } catch (error) {
    console.error("회원가입 에러:", error);
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23503"
    ) {
      return NextResponse.json(
        {
          error:
            "DB 외래키가 아직 기존 사용자 테이블을 참조하고 있습니다. custom-email-auth.sql을 적용해 주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "회원가입 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
