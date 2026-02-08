/**
 * 상품 API
 * GET: 상품 목록 조회 (테넌트별)
 * POST: 상품 생성 (관리자용)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getProductsByTenant,
  createProduct,
} from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { CreateProductDTO } from "@/domain/product/types";

/**
 * GET /api/products
 * 상품 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || DEFAULT_TENANT_ID;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const products = await getProductsByTenant(tenantId, includeInactive);

    return NextResponse.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/products
 * 상품 생성 (관리자용)
 */
export async function POST(request: NextRequest) {
  try {
    // 간단한 쿠키 기반 인증 체크
    const adminAuth = request.cookies.get("admin_auth")?.value;
    if (adminAuth !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const dto: CreateProductDTO = {
      tenantId: body.tenantId || DEFAULT_TENANT_ID,
      name: body.name,
      slug: body.slug,
      description: body.description,
      category: body.category || "hat",
      basePrice: body.basePrice,
      priceTiers: body.priceTiers || undefined,
      images: body.images || [],
      variants: body.variants || [],
      customizableAreas: body.customizableAreas || [],
    };

    // 필수 필드 검증
    if (!dto.name || !dto.slug || !dto.basePrice) {
      return NextResponse.json(
        { error: "name, slug, basePrice are required" },
        { status: 400 },
      );
    }

    const product = await createProduct(dto);

    return NextResponse.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("POST /api/products error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
