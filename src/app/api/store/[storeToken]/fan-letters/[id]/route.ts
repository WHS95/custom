/**
 * GET /api/store/[storeToken]/fan-letters/[id] — 상세 + 댓글
 * PUT /api/store/[storeToken]/fan-letters/[id] — 숨기기/해제 (운영진)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

interface Params {
  params: Promise<{ storeToken: string; id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();
    const { data: letter } = await supabase
      .from("fan_letters")
      .select("id, author_name, message, image_url, like_count, hidden, created_at")
      .eq("id", id)
      .maybeSingle();
    if (!letter || letter.hidden) {
      return NextResponse.json({ error: "팬레터를 찾을 수 없습니다." }, { status: 404 });
    }
    const { data: comments } = await supabase
      .from("fan_letter_comments")
      .select("id, author_name, message, is_owner, created_at")
      .eq("fan_letter_id", id)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        id: letter.id,
        authorName: letter.author_name,
        message: letter.message,
        imageUrl: letter.image_url,
        likeCount: letter.like_count,
        createdAt: letter.created_at,
        comments: (comments ?? []).map((c) => ({
          id: c.id,
          authorName: c.author_name,
          message: c.message,
          isOwner: c.is_owner,
          createdAt: c.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("GET fan-letter detail error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { storeToken, id } = await params;
    const { user, profile } = await getCurrentAuthState();
    const supabase = createServerSupabaseClient();
    const { data: store } = await supabase
      .from("crew_stores")
      .select("id, creator_user_id")
      .eq("store_token", storeToken)
      .maybeSingle();
    if (
      !store ||
      !user ||
      profile?.user_type !== "crew_staff" ||
      store.creator_user_id !== user.id
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    const { hidden } = (await request.json()) as { hidden?: boolean };
    await supabase
      .from("fan_letters")
      .update({ hidden: hidden !== false })
      .eq("id", id)
      .eq("store_id", store.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT fan-letter error:", error);
    return NextResponse.json({ error: "처리에 실패했습니다." }, { status: 500 });
  }
}
