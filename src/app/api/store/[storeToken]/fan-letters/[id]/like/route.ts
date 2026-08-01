/**
 * POST /api/store/[storeToken]/fan-letters/[id]/like — 좋아요(원자 증가)
 * 브라우저별 1회 제한은 클라이언트 localStorage로 가드한다.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";

interface Params {
  params: Promise<{ storeToken: string; id: string }>;
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.rpc("increment_fan_letter_like", {
      p_id: id,
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ success: true, data: { likeCount: data } });
  } catch (error) {
    console.error("POST fan-letter like error:", error);
    return NextResponse.json({ error: "처리에 실패했습니다." }, { status: 500 });
  }
}
