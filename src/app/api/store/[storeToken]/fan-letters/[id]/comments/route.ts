/**
 * POST /api/store/[storeToken]/fan-letters/[id]/comments — 응원 댓글(익명)
 * 상점 소유 운영진이 남기면 is_owner=true(크루 답글로 표시).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

interface Params {
  params: Promise<{ storeToken: string; id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { storeToken, id } = await params;
    const supabase = createServerSupabaseClient();

    // 팬레터 유효성 + 소속 상점 확인
    const { data: store } = await supabase
      .from("crew_stores")
      .select("id, creator_user_id, crew_name")
      .eq("store_token", storeToken)
      .maybeSingle();
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }
    const { data: letter } = await supabase
      .from("fan_letters")
      .select("id")
      .eq("id", id)
      .eq("store_id", store.id)
      .maybeSingle();
    if (!letter) {
      return NextResponse.json({ error: "팬레터를 찾을 수 없습니다." }, { status: 404 });
    }

    const body = (await request.json()) as {
      authorName?: string;
      message?: string;
    };
    const message = (body.message || "").trim();
    if (!message) {
      return NextResponse.json({ error: "댓글을 입력해 주세요." }, { status: 400 });
    }

    // 운영진(상점 주인) 여부
    const { user, profile } = await getCurrentAuthState();
    const isOwner =
      !!user && profile?.user_type === "crew_staff" && store.creator_user_id === user.id;
    const authorName = isOwner
      ? store.crew_name
      : (body.authorName || "").trim().slice(0, 100) || "익명";

    const { data: comment, error } = await supabase
      .from("fan_letter_comments")
      .insert({
        fan_letter_id: id,
        author_name: authorName,
        message: message.slice(0, 500),
        is_owner: isOwner,
      })
      .select("id, author_name, message, is_owner, created_at")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: {
        id: comment.id,
        authorName: comment.author_name,
        message: comment.message,
        isOwner: comment.is_owner,
        createdAt: comment.created_at,
      },
    });
  } catch (error) {
    console.error("POST fan-letter comment error:", error);
    return NextResponse.json({ error: "댓글 작성에 실패했습니다." }, { status: 500 });
  }
}
