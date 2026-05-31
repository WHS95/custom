/**
 * 관리자 크루 승인 API
 *
 * GET /api/admin/crew-approvals - crew_pending 목록 조회
 * PUT /api/admin/crew-approvals - 승인/거절 처리
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";

function getAdminClient() {
  return createClient<Database, "runhousecustom">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema: "runhousecustom" },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}

async function checkAdminAuth() {
  const cookieStore = await cookies();
  return cookieStore.get("admin_auth")?.value === "true";
}

/**
 * GET - crew_pending / crew_staff 목록 조회
 */
export async function GET(request: NextRequest) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "pending";

  const supabase = getAdminClient();

  if (status === "pending") {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, user_id, name, user_type, crew_name, created_at")
      .eq("user_type", "crew_pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("크루 대기 목록 조회 에러:", error);
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    const userIds = (data || []).map((p) => p.user_id);
    const { data: authUsers, error: authUsersError } = await supabase
      .from("customer_auth_users")
      .select("id, email")
      .in("id", userIds);

    if (authUsersError) {
      console.error("사용자 이메일 조회 에러:", authUsersError);
      return NextResponse.json({ error: "조회 실패" }, { status: 500 });
    }

    const emailMap = Object.fromEntries(
      ((authUsers as Array<{ id: string; email: string }> | null) ?? []).map((p) => [
        p.id,
        p.email,
      ])
    );

    return NextResponse.json({
      items: (data || []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        crewName: p.crew_name,
        email: emailMap[p.user_id] || "",
        createdAt: p.created_at,
      })),
    });
  }

  // 처리 완료 목록 (crew_staff + individual 중 crew_name이 있는 것)
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, user_id, name, user_type, crew_name, created_at, updated_at")
    .in("user_type", ["crew_staff", "individual"])
    .not("crew_name", "is", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("처리 완료 목록 조회 에러:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({
    items: (data || []).map((p) => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      crewName: p.crew_name,
      userType: p.user_type,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    })),
  });
}

/**
 * PUT - 승인/거절 처리
 */
export async function PUT(request: NextRequest) {
  if (!(await checkAdminAuth())) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  try {
    const { userId, action } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: "userId와 action이 필요합니다." },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    if (action === "approve") {
      const { error } = await supabase
        .from("user_profiles")
        .update({ user_type: "crew_staff" })
        .eq("user_id", userId)
        .eq("user_type", "crew_pending");

      if (error) {
        console.error("승인 처리 에러:", error);
        return NextResponse.json({ error: "승인 처리 실패" }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "승인 완료" });
    }

    // 거절
    const { error } = await supabase
      .from("user_profiles")
      .update({ user_type: "individual", crew_name: null })
      .eq("user_id", userId)
      .eq("user_type", "crew_pending");

    if (error) {
      console.error("거절 처리 에러:", error);
      return NextResponse.json({ error: "거절 처리 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "거절 완료" });
  } catch (error) {
    console.error("승인/거절 처리 에러:", error);
    return NextResponse.json({ error: "처리 중 오류" }, { status: 500 });
  }
}
