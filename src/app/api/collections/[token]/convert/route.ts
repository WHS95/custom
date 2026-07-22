/**
 * 사이즈 취합 → 주문 전환 API
 * POST: 제출 내역을 색상×사이즈로 집계해 주문 생성 (운영진 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { createOrder } from "@/application/order-service";
import { getProductById } from "@/application/product-service";
import { findCollectionByToken } from "@/lib/collections";
import type { CreateOrderDTO, CreateOrderItemDTO, ShippingInfo } from "@/domain/order";
import { notifyNewOrder } from "@/lib/slack";
import { notifyNewOrderByEmail } from "@/lib/order-email";

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { adminToken, customerName, customerPhone, customerEmail, shippingInfo } =
      body as {
        adminToken?: string;
        customerName?: string;
        customerPhone?: string;
        customerEmail?: string;
        shippingInfo?: ShippingInfo;
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

    if (!customerName?.trim() || !customerPhone?.trim() || !shippingInfo) {
      return NextResponse.json(
        { error: "주문자/배송 정보를 입력해주세요." },
        { status: 400 },
      );
    }
    if (
      !shippingInfo.recipientName ||
      !shippingInfo.phone ||
      !shippingInfo.address
    ) {
      return NextResponse.json(
        { error: "배송 정보가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const product = collection.product_id
      ? await getProductById(collection.product_id)
      : null;
    if (!product) {
      return NextResponse.json(
        { error: "상품 정보를 찾을 수 없습니다." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    // 원자적 선점: 상태를 먼저 'ordered'로 전환해 동시/중복 전환을 차단.
    // 이후 단계가 실패하면 원래 상태로 복구한다.
    const { data: claimed, error: claimError } = await supabase
      .from("size_collections")
      .update({ status: "ordered" })
      .eq("id", collection.id)
      .neq("status", "ordered")
      .select("id");

    if (claimError) {
      throw new Error(claimError.message);
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json(
        { error: "이미 주문으로 전환된 취합입니다." },
        { status: 400 },
      );
    }

    const revertClaim = async () => {
      const { error: revertError } = await supabase
        .from("size_collections")
        .update({ status: collection.status })
        .eq("id", collection.id);
      if (revertError) {
        console.error("취합 상태 복구 실패:", revertError);
      }
    };

    // 선점 이후 조회 — 이 시점부터 제출 수정이 차단되므로 집계가 확정됨
    const { data: responses, error: resError } = await supabase
      .from("size_collection_responses")
      .select("*")
      .eq("collection_id", collection.id);

    if (resError) {
      await revertClaim();
      throw new Error(resError.message);
    }
    if (!responses || responses.length === 0) {
      await revertClaim();
      return NextResponse.json(
        { error: "제출된 사이즈가 없습니다." },
        { status: 400 },
      );
    }

    // 색상 × 사이즈로 집계 (제출된 색상 그대로 — 임의 폴백 없음)
    const unitPrice: number = collection.unit_price ?? product.basePrice;
    const grouped = new Map<string, CreateOrderItemDTO>();
    for (const r of responses) {
      const colorId = r.color_id || "";
      const key = `${colorId}__${r.size}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity += r.quantity;
      } else {
        const variant = product.variants.find((v) => v.id === colorId);
        grouped.set(key, {
          productId: product.id,
          productName: product.name,
          color: colorId || "미지정",
          colorLabel: variant?.label || colorId || "미지정",
          size: r.size,
          quantity: r.quantity,
          unitPrice,
          designLayers: [],
        });
      }
    }

    const memoParts = [
      `[단체 취합 주문] ${collection.title}`,
      `참여 ${responses.length}명`,
      shippingInfo.memo,
    ].filter(Boolean);

    const dto: CreateOrderDTO = {
      tenantId: collection.tenant_id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail?.trim() || undefined,
      shippingInfo: {
        ...shippingInfo,
        organizationName:
          shippingInfo.organizationName || collection.crew_name || undefined,
        memo: memoParts.join(" / "),
      },
      items: Array.from(grouped.values()),
    };

    let order;
    try {
      order = await createOrder(dto);
    } catch (err) {
      await revertClaim();
      throw err;
    }

    // 주문번호 기록
    const { error: updateError } = await supabase
      .from("size_collections")
      .update({ order_number: order.orderNumber })
      .eq("id", collection.id);

    if (updateError) {
      console.error("취합 주문번호 기록 실패:", updateError);
    }

    // 알림 (실패해도 주문 처리에 영향 없음)
    notifyNewOrder(
      order.orderNumber,
      order.customerName,
      order.totalAmount,
      order.items.length,
      dto.shippingInfo.organizationName,
    ).catch((err) => console.error("[Slack] 신규 주문 알림 실패:", err));

    notifyNewOrderByEmail({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail ?? null,
      organizationName: dto.shippingInfo.organizationName,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
    }).catch((err) => console.error("[Email] 신규 주문 메일 실패:", err));

    return NextResponse.json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemCount: order.items.length,
      },
    });
  } catch (error) {
    console.error("POST /api/collections/[token]/convert error:", error);
    return NextResponse.json(
      { error: "주문 전환에 실패했습니다." },
      { status: 500 },
    );
  }
}
