/**
 * 제작 리뷰 — 공장 판정 (공개, 토큰 게이트)
 * POST: { approved: boolean, comment?: string }
 *   pending 상태일 때만 판정 가능(중복 방지) → 운영자 채널 Discord 알림
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import {
  notifyOperatorReviewResult,
  crewHandleFromEmail,
} from "@/lib/discord-notify";

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = (await request.json()) as {
      approved?: boolean;
      comment?: string;
    };
    if (typeof body.approved !== "boolean") {
      return NextResponse.json(
        { error: "제작 가능 여부를 선택해주세요." },
        { status: 400 },
      );
    }
    const comment = (body.comment || "").trim().slice(0, 1000);

    const supabase = createServerSupabaseClient();
    const { data: review } = await supabase
      .from("manufacture_reviews")
      .select("id, status, crew_name, product_id, color_id, creator_user_id")
      .eq("review_token", token)
      .maybeSingle();
    if (!review) {
      return NextResponse.json(
        { error: "제작 문의를 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (review.status !== "pending") {
      return NextResponse.json(
        { error: "이미 판정이 완료된 문의입니다." },
        { status: 409 },
      );
    }

    const { error: updateError } = await supabase
      .from("manufacture_reviews")
      .update({
        status: body.approved ? "approved" : "rejected",
        factory_comment: comment || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", review.id)
      .eq("status", "pending"); // 원자적 — 동시 판정 방지
    if (updateError) throw new Error(updateError.message);

    // 운영자 채널 알림 — 요청자 식별 정보 조회
    const product = await getProductById(review.product_id);
    const variant = product?.variants.find(
      (v: { id: string }) => v.id === review.color_id,
    );
    const { data: creator } = await supabase
      .from("customer_auth_users")
      .select("email")
      .eq("id", review.creator_user_id)
      .maybeSingle();
    const { data: creatorProfile } = await supabase
      .from("user_profiles")
      .select("name, phone")
      .eq("user_id", review.creator_user_id)
      .maybeSingle();
    notifyOperatorReviewResult({
      crewName: review.crew_name ?? "크루",
      handle: crewHandleFromEmail(creator?.email),
      requesterName: creatorProfile?.name,
      phone: creatorProfile?.phone,
      productName: product?.name ?? "상품",
      colorLabel: variant?.label ?? review.color_id,
      approved: body.approved,
      factoryComment: comment || undefined,
    }).catch((err) => console.error("[Discord] 운영자 알림 실패:", err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/manufacture-reviews/[token]/decision error:", error);
    return NextResponse.json({ error: "판정 처리에 실패했습니다." }, { status: 500 });
  }
}
