/**
 * 크루 스토어 조회 API
 * GET: 스토어 정보 + 등록된 커스텀 상품 목록 (공개 — 토큰을 아는 사람만)
 *      로그인한 스토어 주인에게는 관리 토큰 포함
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

interface Params {
  params: Promise<{ storeToken: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const supabase = createServerSupabaseClient();

    const { data: store, error: storeError } = await supabase
      .from("crew_stores")
      .select("*")
      .eq("store_token", storeToken)
      .maybeSingle();

    if (storeError) {
      throw new Error(storeError.message);
    }
    if (!store) {
      return NextResponse.json(
        { error: "스토어를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 스토어 주인 여부 (관리 버튼 노출용)
    let isOwner = false;
    try {
      const { user } = await getCurrentAuthState();
      isOwner = !!user && user.id === store.creator_user_id;
    } catch {
      // 비로그인 무시
    }

    const { data: collections, error: colError } = await supabase
      .from("size_collections")
      .select("token, admin_token, title, status, unit_price, product_id, design_snapshot, design_color_id, deadline, created_at, size_collection_responses(quantity)")
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (colError) {
      throw new Error(colError.message);
    }

    // 상품 이미지 (중복 productId는 1회만 조회)
    const productIds = [...new Set((collections || []).map((c) => c.product_id).filter(Boolean))] as string[];
    const productMap = new Map(
      (await Promise.all(productIds.map((id) => getProductById(id))))
        .filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => [p.id, p]),
    );

    const products = (collections || []).map((c) => {
      const product = c.product_id ? productMap.get(c.product_id) : null;
      const variant = product?.variants.find(
        (v: { id: string }) => v.id === c.design_color_id,
      );
      return {
        token: c.token,
        adminToken: isOwner ? c.admin_token : undefined,
        title: c.title,
        status: c.status,
        unitPrice: c.unit_price,
        deadline: c.deadline,
        createdAt: c.created_at,
        responseCount: c.size_collection_responses?.length ?? 0,
        totalQuantity: (c.size_collection_responses || []).reduce(
          (s: number, r: { quantity: number }) => s + r.quantity,
          0,
        ),
        productName: product?.name ?? null,
        designLayers: c.design_snapshot ?? null,
        designColor:
          product && variant
            ? {
                id: variant.id,
                label: variant.label,
                hex: variant.hex,
                views: Object.fromEntries(
                  product.images
                    .filter((img: { colorId: string }) => img.colorId === variant.id)
                    .map((img: { view: string; url: string }) => [img.view, img.url]),
                ),
              }
            : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        crewName: store.crew_name,
        isOwner,
        products,
      },
    });
  } catch (error) {
    console.error("GET /api/store/[storeToken] error:", error);
    return NextResponse.json(
      { error: "스토어 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
