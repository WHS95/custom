import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import {
  findAuthUserById,
  getCurrentAuthUser,
  updateAuthUserPassword,
} from "@/lib/auth/server-auth";

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다." },
        { status: 400 },
      );
    }

    const authUser = await findAuthUserById(user.id);
    if (!authUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    const isSamePassword = await bcrypt.compare(password, authUser.password_hash);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "새 비밀번호는 현재 비밀번호와 달라야 합니다." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateAuthUserPassword(user.id, passwordHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("비밀번호 변경 에러:", error);
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
