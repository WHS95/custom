/**
 * 관리자 크루 할인 승인 API
 *
 * GET /api/admin/crew-approvals - discount_status='pending' 목록 조회
 * PUT /api/admin/crew-approvals - 할인 승인/거절 처리 (discount_status)
 *
 * 기능 접근(user_type=crew_staff)은 가입 즉시 부여되며, 여기서는 10% 할인가
 * 적용 여부(discount_status)만 관리한다.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/infrastructure/supabase/database.types";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";

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
  return (await getCurrentAdmin()) !== null;
}

/**
 * GET - 할인 승인 대기(pending) / 처리 완료(approved·rejected) 목록 조회
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
      .select(
        "id, user_id, name, crew_name, instagram, runhouse_map_registered, created_at",
      )
      .eq("discount_status", "pending")
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
        instagram: p.instagram,
        runhouseMapRegistered: p.runhouse_map_registered,
        email: emailMap[p.user_id] || "",
        createdAt: p.created_at,
      })),
    });
  }

  // 처리 완료 목록 (승인/거절 완료된 할인 심사)
  const { data, error } = await supabase
    .from("user_profiles")
    .select(
      "id, user_id, name, crew_name, instagram, runhouse_map_registered, discount_status, discount_reviewed_at, created_at, updated_at",
    )
    .in("discount_status", ["approved", "rejected"])
    .order("discount_reviewed_at", { ascending: false })
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
      instagram: p.instagram,
      runhouseMapRegistered: p.runhouse_map_registered,
      discountStatus: p.discount_status,
      createdAt: p.created_at,
      updatedAt: p.discount_reviewed_at || p.updated_at,
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

    // 기능 접근(user_type=crew_staff)은 유지하고 할인 승인 상태만 변경한다.
    const nextStatus = action === "approve" ? "approved" : "rejected";
    const { error } = await supabase
      .from("user_profiles")
      .update({
        discount_status: nextStatus,
        discount_reviewed_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("discount_status", "pending");

    if (error) {
      console.error("할인 승인 처리 에러:", error);
      return NextResponse.json({ error: "처리 실패" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "승인 완료" : "거절 완료",
    });
  } catch (error) {
    console.error("승인/거절 처리 에러:", error);
    return NextResponse.json({ error: "처리 중 오류" }, { status: 500 });
  }
}
