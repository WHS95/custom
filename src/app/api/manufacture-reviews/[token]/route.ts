/**
 * 제작 리뷰 — 공장 확인 페이지 데이터 (공개, 토큰 게이트)
 * GET: 시안(design_snapshot)·색상 뷰·첨부·상태 반환 → /review/[token] 렌더용
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById, getPrintAreas } from "@/application/product-service";
import { crewHandleFromEmail } from "@/lib/discord-notify";
import type { HatView } from "@/lib/store/studio-context";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const supabase = createServerSupabaseClient();

    const { data: review } = await supabase
      .from("manufacture_reviews")
      .select("*")
      .eq("review_token", token)
      .maybeSingle();
    if (!review) {
      return NextResponse.json(
        { error: "제작 문의를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const product = await getProductById(review.product_id);
    const variant = product?.variants.find(
      (v: { id: string }) => v.id === review.color_id,
    );
    const printAreas = product
      ? await getPrintAreas(review.product_id, review.color_id)
      : {};

    // 요청자 식별 정보 (핸들·담당자·연락처)
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

    // 색상 뷰 이미지 (HatDesignCanvas 렌더용)
    const views = product
      ? Object.fromEntries(
          product.images
            .filter((img: { colorId: string }) => img.colorId === review.color_id)
            .map((img: { view: string; url: string }) => [img.view, img.url]),
        )
      : {};

    return NextResponse.json({
      success: true,
      data: {
        crewName: review.crew_name,
        handle: crewHandleFromEmail(creator?.email),
        requesterName: creatorProfile?.name ?? null,
        phone: creatorProfile?.phone || null,
        productName: product?.name ?? "상품",
        note: review.note,
        status: review.status,
        factoryComment: review.factory_comment,
        reviewedAt: review.reviewed_at,
        attachments: review.attachments ?? [],
        designLayers: review.design_snapshot,
        printAreas,
        designColor: variant
          ? {
              id: variant.id,
              label: variant.label,
              hex: variant.hex,
              views: views as Record<HatView, string>,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/manufacture-reviews/[token] error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}
