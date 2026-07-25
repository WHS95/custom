/**
 * 크루 스토어 상품 등록 API
 * POST: 스튜디오에서 만든 커스텀 디자인을 우리 크루 상점에 등록 (크루 로그인 필요)
 *
 * 크루 계정당 스토어 1개 (없으면 자동 생성).
 * 상품 = design 스냅샷이 붙은 size_collection (기존 취합·집계·발주 파이프라인 재사용)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await getCurrentAuthState();
    if (!user) {
      return NextResponse.json(
        { error: "크루 로그인이 필요합니다." },
        { status: 401 },
      );
    }
    // 크루 운영진(crew_staff)만 상점에 굿즈 등록 가능
    if (profile?.user_type !== "crew_staff") {
      return NextResponse.json(
        {
          error:
            profile?.user_type === "crew_pending"
              ? "크루 승인 대기 중입니다. 승인 후 등록할 수 있어요."
              : "크루 운영진 계정만 상점에 등록할 수 있습니다.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { productId, colorId, designLayers, title, unitPrice } = body as {
      productId?: string;
      colorId?: string;
      designLayers?: unknown[];
      title?: string;
      unitPrice?: number;
    };

    if (!productId || !colorId || !Array.isArray(designLayers) || designLayers.length === 0) {
      return NextResponse.json(
        { error: "상품, 색상, 디자인이 필요합니다." },
        { status: 400 },
      );
    }

    const product = await getProductById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: "상품을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (!product.variants.some((v) => v.id === colorId)) {
      return NextResponse.json(
        { error: "디자인 색상이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const crewName =
      profile?.crew_name || profile?.name || "우리 크루";

    const supabase = createServerSupabaseClient();

    // 스토어 조회 또는 생성 (계정당 1개)
    const { data: existingStore, error: storeFindError } = await supabase
      .from("crew_stores")
      .select("id, store_token, crew_name")
      .eq("creator_user_id", user.id)
      .maybeSingle();

    if (storeFindError) {
      throw new Error(storeFindError.message);
    }

    let store = existingStore;
    if (!store) {
      const { data: newStore, error: storeError } = await supabase
        .from("crew_stores")
        .insert({
          tenant_id: DEFAULT_TENANT_ID,
          creator_user_id: user.id,
          store_token: randomBytes(9).toString("base64url"),
          crew_name: crewName,
        })
        .select("id, store_token, crew_name")
        .single();
      if (storeError) {
        // 동시 요청으로 이미 생성된 경우 재조회
        const { data: retry } = await supabase
          .from("crew_stores")
          .select("id, store_token, crew_name")
          .eq("creator_user_id", user.id)
          .maybeSingle();
        if (!retry) throw new Error(storeError.message);
        store = retry;
      } else {
        store = newStore;
      }
    }

    // 상품(취합) 생성
    const token = randomBytes(9).toString("base64url");
    const adminToken = randomBytes(18).toString("base64url");
    const variant = product.variants.find((v) => v.id === colorId);

    const { error: insertError } = await supabase.from("size_collections").insert({
      tenant_id: DEFAULT_TENANT_ID,
      token,
      admin_token: adminToken,
      title:
        title?.trim().slice(0, 200) ||
        `${product.name} — ${variant?.label ?? colorId}`,
      crew_name: store.crew_name,
      product_id: productId,
      unit_price:
        typeof unitPrice === "number" && Number.isInteger(unitPrice) && unitPrice >= 0
          ? unitPrice
          : product.basePrice,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      design_snapshot: designLayers as any,
      design_color_id: colorId,
      creator_user_id: user.id,
      store_id: store.id,
    });

    if (insertError) {
      throw new Error(insertError.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        storeToken: store.store_token,
        productToken: token,
        adminToken,
      },
    });
  } catch (error) {
    console.error("POST /api/store/register error:", error);
    return NextResponse.json(
      { error: "크루 상품 등록에 실패했습니다." },
      { status: 500 },
    );
  }
}
