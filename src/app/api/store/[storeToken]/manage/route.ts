/**
 * 크루 스토어 관리 API (운영진 = store owner 세션 전용)
 *
 * GET   : 관리 화면 데이터 일괄 조회
 *         - 상점 설정(운영기간) · 굿즈 목록 · 전체 응답(주문자별 그룹 재료)
 *         - 주문 전환된 건들의 orders 진행 상태
 * PATCH : { store?: { openFrom, openUntil } }             — 상점 설정
 *         { product?: { token, action | title/unitPrice/deadline } } — 굿즈 관리
 *           action: "close" | "reopen" | "delete"
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

interface Params {
  params: Promise<{ storeToken: string }>;
}

async function findOwnedStore(storeToken: string) {
  const supabase = createServerSupabaseClient();
  const { data: store } = await supabase
    .from("crew_stores")
    .select("*")
    .eq("store_token", storeToken)
    .maybeSingle();
  if (!store) return { store: null, error: "상점을 찾을 수 없습니다.", status: 404 };

  const { user } = await getCurrentAuthState();
  if (!user || user.id !== store.creator_user_id) {
    return { store: null, error: "상점 관리 권한이 없습니다.", status: 403 };
  }
  return { store, error: null, status: 200 };
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const { store, error, status } = await findOwnedStore(storeToken);
    if (!store) return NextResponse.json({ error }, { status });

    const supabase = createServerSupabaseClient();

    const { data: collections } = await supabase
      .from("size_collections")
      .select(
        "id, token, admin_token, title, status, unit_price, deadline, order_number, created_at, product_id, design_color_id, size_collection_responses(*)",
      )
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    // 전환된 주문들의 진행 상태
    const orderNumbers = [
      ...new Set((collections || []).map((c) => c.order_number).filter(Boolean)),
    ] as string[];
    let orders: Array<{
      order_number: string;
      status: string;
      total_amount: number;
      shipping_info: unknown;
      created_at: string;
    }> = [];
    if (orderNumbers.length > 0) {
      const { data } = await supabase
        .from("orders")
        .select("order_number, status, total_amount, shipping_info, created_at")
        .in("order_number", orderNumbers);
      orders = data || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        crewName: store.crew_name,
        storeToken: store.store_token,
        openFrom: store.open_from,
        openUntil: store.open_until,
        products: (collections || []).map((c) => ({
          token: c.token,
          adminToken: c.admin_token,
          title: c.title,
          status: c.status,
          unitPrice: c.unit_price,
          deadline: c.deadline,
          orderNumber: c.order_number,
          createdAt: c.created_at,
          responses: (c.size_collection_responses || []).map((r) => ({
            id: r.id,
            name: r.name,
            phoneLast4: r.phone_last4,
            submissionId: r.submission_id,
            colorId: r.color_id,
            size: r.size,
            quantity: r.quantity,
            note: r.note,
            createdAt: r.created_at,
          })),
        })),
        orders,
      },
    });
  } catch (error) {
    console.error("GET /api/store/[storeToken]/manage error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const { store, error, status } = await findOwnedStore(storeToken);
    if (!store) return NextResponse.json({ error }, { status });

    const body = (await request.json()) as {
      store?: { openFrom?: string | null; openUntil?: string | null };
      product?: {
        token: string;
        action?: "close" | "reopen" | "delete";
        title?: string;
        unitPrice?: number;
        deadline?: string | null;
      };
    };

    const supabase = createServerSupabaseClient();

    // ── 상점 설정 (운영기간) ──
    if (body.store) {
      const { openFrom, openUntil } = body.store;
      const dateRe = /^\d{4}-\d{2}-\d{2}$/;
      if (
        (openFrom && !dateRe.test(openFrom)) ||
        (openUntil && !dateRe.test(openUntil))
      ) {
        return NextResponse.json(
          { error: "날짜 형식이 올바르지 않습니다." },
          { status: 400 },
        );
      }
      const { error: upError } = await supabase
        .from("crew_stores")
        .update({
          open_from: openFrom ?? null,
          open_until: openUntil ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", store.id);
      if (upError) throw new Error(upError.message);
    }

    // ── 굿즈 관리 ──
    if (body.product) {
      const { data: col } = await supabase
        .from("size_collections")
        .select("id, status")
        .eq("token", body.product.token)
        .eq("store_id", store.id)
        .maybeSingle();
      if (!col) {
        return NextResponse.json(
          { error: "굿즈를 찾을 수 없습니다." },
          { status: 404 },
        );
      }

      if (body.product.action === "delete") {
        if (col.status === "ordered") {
          return NextResponse.json(
            { error: "주문 전환된 굿즈는 삭제할 수 없습니다." },
            { status: 400 },
          );
        }
        const { error: delError } = await supabase
          .from("size_collections")
          .delete()
          .eq("id", col.id);
        if (delError) throw new Error(delError.message);
      } else {
        const updateData: Record<string, unknown> = {};
        if (body.product.action === "close") updateData.status = "closed";
        if (body.product.action === "reopen") {
          if (col.status === "ordered") {
            return NextResponse.json(
              { error: "주문 전환된 굿즈는 재오픈할 수 없습니다." },
              { status: 400 },
            );
          }
          updateData.status = "open";
        }
        if (body.product.title?.trim())
          updateData.title = body.product.title.trim().slice(0, 200);
        if (body.product.unitPrice !== undefined) {
          if (
            !Number.isInteger(body.product.unitPrice) ||
            body.product.unitPrice < 0
          ) {
            return NextResponse.json(
              { error: "가격이 올바르지 않습니다." },
              { status: 400 },
            );
          }
          updateData.unit_price = body.product.unitPrice;
        }
        if (body.product.deadline !== undefined)
          updateData.deadline = body.product.deadline;

        if (Object.keys(updateData).length > 0) {
          const { error: upError } = await supabase
            .from("size_collections")
            .update(updateData)
            .eq("id", col.id);
          if (upError) throw new Error(upError.message);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/store/[storeToken]/manage error:", error);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
