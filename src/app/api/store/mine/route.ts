/**
 * 내 크루 상점 조회 API
 * GET: 로그인한 크루 운영진의 crew_stores 1건 (없으면 store: null)
 * Navbar "내 상점" 링크·상점 재발견용
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

export async function GET() {
  try {
    const { user, profile } = await getCurrentAuthState();
    if (!user || profile?.user_type !== "crew_staff") {
      return NextResponse.json({ success: true, store: null });
    }

    const supabase = createServerSupabaseClient();
    const { data: store } = await supabase
      .from("crew_stores")
      .select("store_token, crew_name")
      .eq("creator_user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      store: store
        ? { storeToken: store.store_token, crewName: store.crew_name }
        : null,
    });
  } catch (error) {
    console.error("GET /api/store/mine error:", error);
    return NextResponse.json({ success: true, store: null });
  }
}
