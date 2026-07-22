/**
 * 사이즈 취합 API
 * POST: 취합 링크 생성 (크루 운영진용, 로그인 불필요)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { getProductById } from "@/application/product-service";

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

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("size_collections")
      .insert({
        tenant_id: DEFAULT_TENANT_ID,
        token,
        admin_token: adminToken,
        title: title.trim().slice(0, 200),
        crew_name: crewName?.trim().slice(0, 200) || null,
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
