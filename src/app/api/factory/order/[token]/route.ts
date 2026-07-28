/**
 * GET /api/factory/order/[token] — 공장용 주문 상세 조회 (토큰 게이트, 공개)
 * 크루 스토어 주문 확정 시 발급된 factory_token으로 주문을 조회해
 * 굿즈(디자인)별 시안·사이즈·수량 + 배송지를 반환한다.
 * 시안 상세는 프론트에서 DesignReviewDetail로 렌더(제작 시안 검수와 동일).
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import type { HatView } from "@/lib/store/studio-context";

interface Params {
  params: Promise<{ token: string }>;
}

interface OrderItemRow {
  product_id: string;
  product_name: string;
  color: string;
  color_label: string;
  size: string;
  quantity: number;
  design_snapshot: unknown;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: "잘못된 접근입니다." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_number, created_at, shipping_info, status")
      .eq("factory_token", token)
      .maybeSingle();

    if (!order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const { data: itemsData } = await supabase
      .from("order_items")
      .select(
        "product_id, product_name, color, color_label, size, quantity, design_snapshot",
      )
      .eq("order_id", order.id);

    const items = (itemsData ?? []) as OrderItemRow[];

    // 굿즈(상품명=상품+취합제목 · 색상)별로 묶는다 — 각 그룹이 하나의 디자인
    const groupsMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        color: string;
        colorLabel: string;
        designSnapshot: unknown;
        sizes: { size: string; quantity: number }[];
      }
    >();
    for (const it of items) {
      const key = `${it.product_id}|${it.color}|${it.product_name}`;
      let g = groupsMap.get(key);
      if (!g) {
        g = {
          productId: it.product_id,
          productName: it.product_name,
          color: it.color,
          colorLabel: it.color_label,
          designSnapshot: it.design_snapshot,
          sizes: [],
        };
        groupsMap.set(key, g);
      }
      const s = g.sizes.find((x) => x.size === it.size);
      if (s) s.quantity += it.quantity;
      else g.sizes.push({ size: it.size, quantity: it.quantity });
    }

    // 그룹별 색상 뷰 이미지(designColor) 구성 — 시안 렌더용
    const groups = await Promise.all(
      [...groupsMap.values()].map(async (g) => {
        const product = await getProductById(g.productId);
        const variant = product?.variants.find(
          (v: { id: string }) => v.id === g.color,
        );
        const views = product
          ? Object.fromEntries(
              product.images
                .filter((img: { colorId: string }) => img.colorId === g.color)
                .map((img: { view: string; url: string }) => [img.view, img.url]),
            )
          : {};
        const totalQty = g.sizes.reduce((s, x) => s + x.quantity, 0);
        return {
          productName: g.productName,
          colorLabel: g.colorLabel,
          totalQuantity: totalQty,
          sizes: g.sizes.sort((a, b) => a.size.localeCompare(b.size)),
          designLayers: g.designSnapshot,
          designColor: variant
            ? {
                id: variant.id,
                label: variant.label,
                hex: variant.hex,
                views: views as Record<HatView, string>,
              }
            : null,
        };
      }),
    );

    const shipping =
      (order.shipping_info as {
        recipientName?: string;
        phone?: string;
        address?: string;
        addressDetail?: string;
        organizationName?: string;
        memo?: string;
      } | null) ?? null;

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.order_number,
        createdAt: order.created_at,
        status: order.status,
        shipping,
        groups,
      },
    });
  } catch (error) {
    console.error("GET /api/factory/order/[token] error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}
