/**
 * 크루 스토어 전체 주문 전환 API (운영진 전용)
 *
 * POST: 열려 있고 제출이 있는 모든 굿즈(size_collections)를
 *       하나의 orders 주문(주문번호 1개)으로 합쳐서 전환한다.
 *       - 굿즈×사이즈별로 아이템 생성 (굿즈마다 디자인 스냅샷·단가 유지)
 *       - 전환된 모든 굿즈에 동일 order_number 기록
 * Body: { customerName, customerPhone, customerEmail?, shippingInfo }
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { createOrder } from "@/application/order-service";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";
import type {
  CreateOrderDTO,
  CreateOrderItemDTO,
  ShippingInfo,
} from "@/domain/order";
import { notifyNewOrder } from "@/lib/slack";
import { notifyNewOrderByEmail } from "@/lib/order-email";
import { notifyFactoryOrder } from "@/lib/discord-notify";
import { randomBytes } from "crypto";

interface Params {
  params: Promise<{ storeToken: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const body = (await request.json()) as {
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      shippingInfo?: ShippingInfo;
    };

    const supabase = createServerSupabaseClient();
    const { data: store } = await supabase
      .from("crew_stores")
      .select("*")
      .eq("store_token", storeToken)
      .maybeSingle();
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }
    const { user } = await getCurrentAuthState();
    if (!user || user.id !== store.creator_user_id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { customerName, customerPhone, customerEmail, shippingInfo } = body;
    if (!customerName?.trim() || !customerPhone?.trim() || !shippingInfo) {
      return NextResponse.json(
        { error: "주문자/배송 정보를 입력해주세요." },
        { status: 400 },
      );
    }
    if (!shippingInfo.recipientName || !shippingInfo.phone || !shippingInfo.address) {
      return NextResponse.json(
        { error: "배송 정보가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    // 대상: open 상태 + 제출 있는 굿즈들
    const { data: collections } = await supabase
      .from("size_collections")
      .select("*, size_collection_responses(*)")
      .eq("store_id", store.id)
      .eq("status", "open");
    const targets = (collections || []).filter(
      (c) => (c.size_collection_responses || []).length > 0,
    );
    if (targets.length === 0) {
      return NextResponse.json(
        { error: "주문할 제출 내역이 있는 굿즈가 없습니다." },
        { status: 400 },
      );
    }

    // 원자적 선점: 대상 전부 ordered로 전환 (동시 전환 차단). 실패 시 복구.
    const targetIds = targets.map((c) => c.id);
    const { data: claimed, error: claimError } = await supabase
      .from("size_collections")
      .update({ status: "ordered" })
      .in("id", targetIds)
      .eq("status", "open")
      .select("id");
    if (claimError) throw new Error(claimError.message);
    if (!claimed || claimed.length !== targetIds.length) {
      // 일부만 선점됨 → 전부 복구 후 재시도 요청
      await supabase
        .from("size_collections")
        .update({ status: "open" })
        .in("id", (claimed || []).map((c) => c.id));
      return NextResponse.json(
        { error: "다른 전환이 진행 중입니다. 잠시 후 다시 시도해주세요." },
        { status: 409 },
      );
    }
    const revertClaim = async () => {
      const { error: revertError } = await supabase
        .from("size_collections")
        .update({ status: "open" })
        .in("id", targetIds);
      if (revertError) console.error("전체 전환 상태 복구 실패:", revertError);
    };

    try {
      // 굿즈별 × 사이즈별 아이템 집계 (굿즈마다 디자인·단가 유지)
      const items: CreateOrderItemDTO[] = [];
      let totalResponses = 0;
      for (const col of targets) {
        const product = col.product_id ? await getProductById(col.product_id) : null;
        if (!product) throw new Error(`상품 정보를 찾을 수 없습니다: ${col.title}`);
        const unitPrice: number = col.unit_price ?? product.basePrice;
        const designLayers = Array.isArray(col.design_snapshot)
          ? (col.design_snapshot as unknown as CreateOrderItemDTO["designLayers"])
          : [];
        const grouped = new Map<string, CreateOrderItemDTO>();
        for (const r of col.size_collection_responses || []) {
          totalResponses++;
          const colorId = r.color_id || "";
          const key = `${colorId}__${r.size}`;
          const existing = grouped.get(key);
          if (existing) {
            existing.quantity += r.quantity;
          } else {
            const variant = product.variants.find(
              (v: { id: string }) => v.id === colorId,
            );
            grouped.set(key, {
              productId: product.id,
              productName: `${product.name} — ${col.title}`,
              color: colorId || "미지정",
              colorLabel: variant?.label || colorId || "미지정",
              size: r.size,
              quantity: r.quantity,
              unitPrice,
              designLayers,
            });
          }
        }
        items.push(...grouped.values());
      }

      const memoParts = [
        `[크루 스토어 전체 주문] ${store.crew_name}`,
        `굿즈 ${targets.length}종 · 제출 ${totalResponses}건`,
        shippingInfo.memo,
      ].filter(Boolean);

      const dto: CreateOrderDTO = {
        tenantId: store.tenant_id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || undefined,
        shippingInfo: {
          ...shippingInfo,
          organizationName: shippingInfo.organizationName || store.crew_name,
          memo: memoParts.join(" / "),
        },
        items,
      };

      const order = await createOrder(dto);

      // 전환된 모든 굿즈에 동일 주문번호 기록
      const { error: updateError } = await supabase
        .from("size_collections")
        .update({ order_number: order.orderNumber })
        .in("id", targetIds);
      if (updateError) console.error("전체 전환 주문번호 기록 실패:", updateError);

      // 공장 확인 토큰 발급 → 주문에 저장 → 공장 Discord 알림
      const factoryToken = randomBytes(18).toString("base64url");
      const { error: tokenError } = await supabase
        .from("orders")
        .update({ factory_token: factoryToken })
        .eq("order_number", order.orderNumber);
      if (tokenError) console.error("공장 토큰 기록 실패:", tokenError);
      else {
        const siteUrl =
          process.env.NEXT_PUBLIC_SITE_URL ?? "https://runhouse-custom.vercel.app";
        const totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
        const addr = [shippingInfo.address, shippingInfo.addressDetail]
          .filter(Boolean)
          .join(" ");
        notifyFactoryOrder({
          crewName: store.crew_name,
          requesterName: customerName.trim(),
          phone: customerPhone.trim(),
          orderNumber: order.orderNumber,
          productCount: targets.length,
          totalQuantity,
          address: addr || null,
          viewUrl: `${siteUrl}/factory/order/${factoryToken}`,
        }).catch((err) => console.error("[Discord] 공장 주문 알림 실패:", err));
      }

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
          productCount: targets.length,
        },
      });
    } catch (err) {
      await revertClaim();
      throw err;
    }
  } catch (error) {
    console.error("POST /api/store/[storeToken]/convert-all error:", error);
    return NextResponse.json(
      { error: "전체 주문 전환에 실패했습니다." },
      { status: 500 },
    );
  }
}
