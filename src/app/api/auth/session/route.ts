import { NextResponse } from "next/server";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

export async function GET() {
  try {
    const authState = await getCurrentAuthState();
    return NextResponse.json(authState);
  } catch (error) {
    console.error("세션 조회 에러:", error);
    return NextResponse.json(
      {
        session: null,
        user: null,
        profile: null,
      },
      { status: 200 },
    );
  }
}
