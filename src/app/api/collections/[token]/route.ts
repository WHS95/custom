/**
 * 사이즈 취합 상세 API
 * GET: 취합 정보 조회 (공개) / 관리자 키 포함 시 제출 목록 포함
 * PATCH: 취합 상태 변경 (마감/재오픈) — 관리자 키 필요
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import {
  findCollectionByToken,
  getAllowedColors,
  type SizeCollectionResponseRow,
} from "@/lib/collections";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("key");

    const collection = await findCollectionByToken(token);
    if (!collection) {
      return NextResponse.json(
        { error: "취합을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const isManager = !!adminKey && adminKey === collection.admin_token;

    // 마감일 경과 시 자동 마감 처리 (표시용)
    const deadlinePassed =
      !!collection.deadline && new Date(collection.deadline) < new Date();

    const supabase = createServerSupabaseClient();
    const [product, responsesResult] = await Promise.all([
      collection.product_id
        ? getProductById(collection.product_id)
        : Promise.resolve(null),
      supabase
        .from("size_collection_responses")
        .select("*")
        .eq("collection_id", collection.id)
        .order("created_at", { ascending: true }),
    ]);

    if (responsesResult.error) {
      throw new Error(responsesResult.error.message);
    }

    const allowedColors = getAllowedColors(collection);
    const variants =
      product?.variants.filter(
        (v) => allowedColors.length === 0 || allowedColors.includes(v.id),
      ) || [];

    const rows: SizeCollectionResponseRow[] = responsesResult.data || [];
    const totalQuantity = rows.reduce((s, r) => s + r.quantity, 0);

    return NextResponse.json({
      success: true,
      data: {
        title: collection.title,
        crewName: collection.crew_name,
        status: collection.status,
        deadline: collection.deadline,
        deadlinePassed,
        unitPrice: collection.unit_price,
        depositInfo: collection.deposit_info,
        orderNumber: isManager ? collection.order_number : undefined,
        responseCount: rows.length,
        totalQuantity,
        product: product
          ? {
              id: product.id,
              name: product.name,
              // 제출 페이지는 정면 이미지만 사용 — 페이로드 최소화
              images: product.images.filter((img) => img.view === "front"),
              variants,
            }
          : null,
        // 관리자에게만 제출 상세 공개
        responses: isManager
          ? rows.map((r) => ({
              id: r.id,
              name: r.name,
              colorId: r.color_id,
              size: r.size,
              quantity: r.quantity,
              note: r.note,
              isPaid: r.is_paid,
              createdAt: r.created_at,
            }))
          : undefined,
      },
    });
  } catch (error) {
    console.error("GET /api/collections/[token] error:", error);
    return NextResponse.json(
      { error: "취합 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { adminToken, status } = body as {
      adminToken?: string;
      status?: string;
    };

    const collection = await findCollectionByToken(token);
    if (!collection) {
      return NextResponse.json(
        { error: "취합을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (!adminToken || adminToken !== collection.admin_token) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (collection.status === "ordered") {
      return NextResponse.json(
        { error: "이미 주문으로 전환된 취합입니다." },
        { status: 400 },
      );
    }
    if (status !== "open" && status !== "closed") {
      return NextResponse.json(
        { error: "상태 값이 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("size_collections")
      .update({ status })
      .eq("id", collection.id)
      .neq("status", "ordered");

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/collections/[token] error:", error);
    return NextResponse.json(
      { error: "취합 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
