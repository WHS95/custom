import { NextResponse } from "next/server";
import { getCurrentAuthState } from "@/lib/auth/server-auth";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { Json } from "@/infrastructure/supabase/database.types";

/**
 * 장바구니 DB 동기화 서버 라우트
 *
 * user_carts 테이블은 RLS 정책이 `auth.uid() = user_id` 기준이지만,
 * 이 앱은 Supabase Auth가 아닌 커스텀 인증(customer_auth_users)을 쓰므로
 * 브라우저(anon) 클라이언트에서는 auth.uid()가 null → 쓰기가 RLS에 막힌다.
 * 따라서 장바구니 읽기/쓰기는 이 라우트에서 service_role로 처리한다.
 *
 * user_id는 세션 쿠키에서 서버가 직접 도출한다(클라이언트 값 신뢰 X).
 */

interface CartItemPayload {
  productId: string;
  productName: string;
  color: string;
  colorLabel: string;
  size: string;
  quantity: number;
  unitPrice: number;
  designLayers: unknown;
}

// GET: 현재 로그인 사용자의 장바구니 조회
export async function GET() {
  const { user } = await getCurrentAuthState();
  if (!user) {
    return NextResponse.json({ items: [] });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_carts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("장바구니 조회 에러:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    return NextResponse.json({ error: "장바구니 조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

// PUT: 현재 장바구니 전체 교체(기존 삭제 후 재삽입)
export async function PUT(request: Request) {
  const { user } = await getCurrentAuthState();
  if (!user) {
    return NextResponse.json({ error: "인증 필요" }, { status: 401 });
  }

  let body: { items?: CartItemPayload[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const items = body.items ?? [];
  const supabase = createServerSupabaseClient();

  // 기존 장바구니 삭제
  const { error: deleteError } = await supabase
    .from("user_carts")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("장바구니 삭제 에러:", {
      message: deleteError.message,
      details: deleteError.details,
      hint: deleteError.hint,
      code: deleteError.code,
    });
    return NextResponse.json({ error: "장바구니 삭제 실패" }, { status: 500 });
  }

  if (items.length > 0) {
    const cartData = items.map((item) => ({
      user_id: user.id,
      tenant_id: DEFAULT_TENANT_ID,
      product_id: item.productId,
      product_name: item.productName,
      color: item.color,
      color_label: item.colorLabel,
      size: item.size,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      design_layers: item.designLayers as Json,
    }));

    const { error: insertError } = await supabase
      .from("user_carts")
      .insert(cartData);

    if (insertError) {
      console.error("장바구니 저장 에러:", {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
      });
      return NextResponse.json({ error: "장바구니 저장 실패" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
