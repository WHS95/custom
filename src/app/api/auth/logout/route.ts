import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSessionByToken } from "@/lib/auth/server-auth";
import { AUTH_SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

    if (token) {
      await deleteSessionByToken(token);
    }
  } catch (error) {
    console.error("로그아웃 에러:", error);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(AUTH_SESSION_COOKIE);
  return response;
}
