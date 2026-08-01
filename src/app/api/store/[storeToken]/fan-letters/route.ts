/**
 * 크루 상점 팬레터 API
 * GET  /api/store/[storeToken]/fan-letters  — 목록(숨김 제외, 댓글 수 포함)
 * POST /api/store/[storeToken]/fan-letters  — 작성(익명, 이미지 첨부, multipart)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { uploadReviewAttachment } from "@/infrastructure/supabase/storage";

interface Params {
  params: Promise<{ storeToken: string }>;
}

async function resolveStore(storeToken: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("crew_stores")
    .select("id, tenant_id, crew_name")
    .eq("store_token", storeToken)
    .maybeSingle();
  return data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const store = await resolveStore(storeToken);
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }
    const supabase = createServerSupabaseClient();
    const { data: letters } = await supabase
      .from("fan_letters")
      .select("id, author_name, message, image_url, like_count, created_at")
      .eq("store_id", store.id)
      .eq("hidden", false)
      .order("created_at", { ascending: false })
      .limit(200);

    const ids = (letters ?? []).map((l) => l.id);
    const countMap = new Map<string, number>();
    if (ids.length > 0) {
      const { data: comments } = await supabase
        .from("fan_letter_comments")
        .select("fan_letter_id")
        .in("fan_letter_id", ids);
      for (const c of comments ?? [])
        countMap.set(c.fan_letter_id, (countMap.get(c.fan_letter_id) ?? 0) + 1);
    }

    const items = (letters ?? []).map((l) => ({
      id: l.id,
      authorName: l.author_name,
      message: l.message,
      imageUrl: l.image_url,
      likeCount: l.like_count,
      commentCount: countMap.get(l.id) ?? 0,
      createdAt: l.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: { crewName: store.crew_name, items },
    });
  } catch (error) {
    console.error("GET fan-letters error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const store = await resolveStore(storeToken);
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }

    const form = await request.formData();
    const authorName = String(form.get("authorName") || "").trim();
    const message = String(form.get("message") || "").trim();
    const image = form.get("image");

    if (!authorName || !message) {
      return NextResponse.json(
        { error: "이름과 메시지를 입력해 주세요." },
        { status: 400 },
      );
    }
    if (message.length > 500) {
      return NextResponse.json(
        { error: "메시지는 500자까지 쓸 수 있어요." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: letter, error } = await supabase
      .from("fan_letters")
      .insert({
        tenant_id: store.tenant_id,
        store_id: store.id,
        author_name: authorName.slice(0, 100),
        message,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // 이미지 첨부(선택) — 1장
    if (image instanceof File && image.size > 0) {
      const ext = image.name.slice(image.name.lastIndexOf(".")).toLowerCase();
      if ([".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic"].includes(ext)) {
        const uploaded = await uploadReviewAttachment(
          image,
          `fanletter-${letter.id}`,
          image.name,
          true,
        );
        if (uploaded) {
          await supabase
            .from("fan_letters")
            .update({ image_url: uploaded.url })
            .eq("id", letter.id);
        }
      }
    }

    return NextResponse.json({ success: true, data: { id: letter.id } });
  } catch (error) {
    console.error("POST fan-letters error:", error);
    return NextResponse.json({ error: "작성에 실패했습니다." }, { status: 500 });
  }
}
