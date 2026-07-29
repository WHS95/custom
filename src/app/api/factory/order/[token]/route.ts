/**
 * GET /api/factory/order/[token] — 공장용 주문 상세 조회 (토큰 게이트, 공개)
 * 크루 스토어 주문 확정 시 발급된 factory_token으로 주문을 조회해
 * 굿즈(디자인)별 시안 + 사이즈/수량(또는 개인화 명단) + 배송지를 반환한다.
 *
 * 주문을 구성한 취합(size_collections)을 order_number로 되짚어,
 * - 일반 굿즈: 사이즈별 수량 집계
 * - 개인화 굿즈(이름 자리 포함): 크루원별 명단(새길 이름·실명·사이즈)
 * 을 응답(size_collection_responses)에서 직접 만든다.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import { hasNameField } from "@/lib/personalization";
import type { HatView } from "@/lib/store/studio-context";

interface Params {
  params: Promise<{ token: string }>;
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

    // 주문을 구성한 취합들
    const { data: cols } = await supabase
      .from("size_collections")
      .select("id, title, product_id, design_color_id, design_snapshot")
      .eq("order_number", order.order_number);

    const collections = cols ?? [];

    const groups = await Promise.all(
      collections.map(async (col) => {
        const product = col.product_id ? await getProductById(col.product_id) : null;
        const variant = product?.variants.find(
          (v: { id: string }) => v.id === col.design_color_id,
        );
        const views = product
          ? Object.fromEntries(
              product.images
                .filter((img: { colorId: string }) => img.colorId === col.design_color_id)
                .map((img: { view: string; url: string }) => [img.view, img.url]),
            )
          : {};

        const { data: resp } = await supabase
          .from("size_collection_responses")
          .select("name, custom_name, size, quantity")
          .eq("collection_id", col.id);
        const responses = resp ?? [];

        const personalized = hasNameField(
          col.design_snapshot as { type?: string; nameField?: boolean }[] | null,
        );
        const totalQuantity = responses.reduce((s, r) => s + (r.quantity ?? 0), 0);

        // 개인화: 사람별 명단 / 일반: 사이즈별 집계
        let roster: { customName: string; realName: string; size: string; quantity: number }[] | null =
          null;
        let sizes: { size: string; quantity: number }[] | null = null;

        if (personalized) {
          roster = responses
            .map((r) => ({
              customName: r.custom_name ?? "",
              realName: r.name ?? "",
              size: r.size,
              quantity: r.quantity ?? 1,
            }))
            .sort((a, b) => a.customName.localeCompare(b.customName));
        } else {
          const m = new Map<string, number>();
          for (const r of responses) m.set(r.size, (m.get(r.size) ?? 0) + (r.quantity ?? 0));
          sizes = [...m.entries()]
            .map(([size, quantity]) => ({ size, quantity }))
            .sort((a, b) => a.size.localeCompare(b.size));
        }

        return {
          productName: col.title || product?.name || "굿즈",
          colorLabel: variant?.label ?? col.design_color_id ?? "미지정",
          totalQuantity,
          personalized,
          roster,
          sizes,
          designLayers: col.design_snapshot,
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
