/**
 * 크루 승인 API
 *
 * POST /api/crew-approval - 토큰 생성 (가입 후 호출)
 * GET /api/crew-approval?token=xxx - 토큰 검증 및 유저 정보 반환
 * PUT /api/crew-approval - 승인/거절 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  generateApprovalToken,
  verifyApprovalToken,
} from "@/lib/crew-approval-token";

// Service Role 클라이언트 (runhousecustom 스키마, RLS 우회)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: "runhousecustom" },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

/**
 * POST - 승인 토큰 생성
 */
export async function POST(request: NextRequest) {
  try {
    const { email, crewName } = await request.json();

    if (!email || !crewName) {
      return NextResponse.json(
        { error: "이메일과 크루 이름이 필요합니다." },
        { status: 400 }
      );
    }

    const token = generateApprovalToken(email, crewName);
    const baseUrl = request.nextUrl.origin;
    const approvalUrl = `${baseUrl}/crew-approval/${token}`;

    return NextResponse.json({ token, approvalUrl });
  } catch (error) {
    console.error("토큰 생성 에러:", error);
    return NextResponse.json(
      { error: "토큰 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

/**
 * GET - 토큰 검증 및 유저 정보 반환
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "토큰이 필요합니다." },
        { status: 400 }
      );
    }

    const payload = verifyApprovalToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "유효하지 않거나 만료된 토큰입니다." },
        { status: 400 }
      );
    }

    // 유저 프로필 조회
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("id, user_id, name, user_type, crew_name, created_at")
      .eq("crew_name", payload.crewName)
      .in("user_type", ["crew_pending", "crew_staff"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      valid: true,
      email: payload.email,
      crewName: payload.crewName,
      requestedAt: new Date(payload.timestamp).toISOString(),
      profile: profile
        ? {
            id: profile.id,
            name: profile.name,
            userType: profile.user_type,
            crewName: profile.crew_name,
            createdAt: profile.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error("토큰 검증 에러:", error);
    return NextResponse.json(
      { error: "검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PUT - 승인/거절 처리
 */
export async function PUT(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json(
        { error: "토큰과 액션이 필요합니다." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    const payload = verifyApprovalToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "유효하지 않거나 만료된 토큰입니다." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // 해당 이메일로 auth 유저 찾기
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(
      (u) => u.email === payload.email
    );

    if (!authUser) {
      return NextResponse.json(
        { error: "해당 이메일의 사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (action === "approve") {
      // crew_pending → crew_staff 업데이트
      const { error } = await supabase
        .from("user_profiles")
        .update({ user_type: "crew_staff" })
        .eq("user_id", authUser.id)
        .eq("user_type", "crew_pending");

      if (error) {
        console.error("승인 처리 에러:", error);
        return NextResponse.json(
          { error: "승인 처리에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${payload.crewName} 크루 멤버가 승인되었습니다.`,
      });
    } else {
      // 거절: crew_pending → individual
      const { error } = await supabase
        .from("user_profiles")
        .update({ user_type: "individual", crew_name: null })
        .eq("user_id", authUser.id)
        .eq("user_type", "crew_pending");

      if (error) {
        console.error("거절 처리 에러:", error);
        return NextResponse.json(
          { error: "거절 처리에 실패했습니다." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `${payload.email} 크루 가입 요청이 거절되었습니다.`,
      });
    }
  } catch (error) {
    console.error("승인/거절 처리 에러:", error);
    return NextResponse.json(
      { error: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
