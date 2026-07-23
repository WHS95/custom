/**
 * 사이즈 취합 API
 * POST: 취합 링크 생성 (크루 운영진용, 로그인 불필요 — 로그인 시 계정에 귀속)
 * GET ?mine=true: 로그인한 크루가 만든 취합 목록
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

/**
 * GET /api/collections?mine=true
 * 내가 만든 취합 목록 (로그인 필요)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get("mine") !== "true") {
      return NextResponse.json({ error: "mine=true가 필요합니다." }, { status: 400 });
    }

    const { user } = await getCurrentAuthState();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("size_collections")
      .select("token, admin_token, title, crew_name, status, deadline, created_at, size_collection_responses(quantity)")
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((c) => ({
        token: c.token,
        adminToken: c.admin_token,
        title: c.title,
        crewName: c.crew_name,
        status: c.status,
        deadline: c.deadline,
        createdAt: c.created_at,
        responseCount: c.size_collection_responses?.length ?? 0,
        totalQuantity: (c.size_collection_responses || []).reduce(
          (s: number, r: { quantity: number }) => s + r.quantity,
          0,
        ),
      })),
    });
  } catch (error) {
    console.error("GET /api/collections error:", error);
    return NextResponse.json(
      { error: "취합 목록 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      crewName,
      productId,
      allowedColors,
      unitPrice,
      depositInfo,
      deadline,
      designLayers,
      designColorId,
    } = body as {
      title?: string;
      crewName?: string;
      productId?: string;
      allowedColors?: string[];
      unitPrice?: number;
      depositInfo?: string;
      deadline?: string;
      designLayers?: unknown[];
      designColorId?: string;
    };

    if (!title?.trim() || !productId) {
      return NextResponse.json(
        { error: "제목과 상품을 입력해주세요." },
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

    // 허용 색상은 상품 변형에 존재하는 것만
    const variantIds = new Set(product.variants.map((v) => v.id));
    const colors = (allowedColors || []).filter((c) => variantIds.has(c));

    if (
      unitPrice !== undefined &&
      (typeof unitPrice !== "number" || unitPrice < 0 || !Number.isInteger(unitPrice))
    ) {
      return NextResponse.json(
        { error: "가격이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    // 확정 디자인 첨부 (크루 스토어): 디자인 색상은 상품 변형에 존재해야 함
    const hasDesign = Array.isArray(designLayers) && designLayers.length > 0;
    if (hasDesign && (!designColorId || !variantIds.has(designColorId))) {
      return NextResponse.json(
        { error: "디자인 색상이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const token = randomBytes(9).toString("base64url");
    const adminToken = randomBytes(18).toString("base64url");

    // 로그인한 크루면 계정에 귀속 (관리 링크 분실 시에도 목록에서 재접근 가능)
    let creatorUserId: string | null = null;
    let defaultCrewName: string | null = null;
    try {
      const { user, profile } = await getCurrentAuthState();
      creatorUserId = user?.id ?? null;
      defaultCrewName = profile?.crew_name ?? null;
    } catch {
      // 비로그인 생성 허용
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("size_collections")
      .insert({
        tenant_id: DEFAULT_TENANT_ID,
        token,
        admin_token: adminToken,
        title: title.trim().slice(0, 200),
        crew_name: crewName?.trim().slice(0, 200) || defaultCrewName,
        creator_user_id: creatorUserId,
        product_id: productId,
        allowed_colors: colors,
        unit_price: unitPrice ?? product.basePrice,
        deposit_info: depositInfo?.trim() || null,
        deadline: deadline || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        design_snapshot: hasDesign ? (designLayers as any) : null,
        design_color_id: hasDesign ? designColorId : null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`취합 생성 실패: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        token: data.token,
        adminToken: data.admin_token,
      },
    });
  } catch (error) {
    console.error("POST /api/collections error:", error);
    return NextResponse.json(
      { error: "취합 링크 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}
