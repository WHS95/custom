/**
 * GET /api/stores/discover — 크루 상점 디스커버리 (공개)
 * 전체 크루 상점 + 등록된 굿즈(디자인 미리보기 포함)를 모아 반환한다.
 * 마켓플레이스식 둘러보기 페이지(/stores)용.
 */
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";

const GOODS_LIMIT = 60;

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: stores } = await supabase
      .from("crew_stores")
      .select("id, crew_name, store_token, created_at")
      .order("created_at", { ascending: false });
    const storeList = stores ?? [];
    const storeById = new Map(storeList.map((s) => [s.id, s]));

    const storeIds = storeList.map((s) => s.id);
    let collections: Array<{
      store_id: string;
      token: string;
      title: string;
      unit_price: number | null;
      product_id: string | null;
      design_snapshot: unknown;
      design_color_id: string | null;
      created_at: string;
      size_collection_responses: { quantity: number }[] | null;
    }> = [];
    if (storeIds.length > 0) {
      const { data } = await supabase
        .from("size_collections")
        .select(
          "store_id, token, title, unit_price, product_id, design_snapshot, design_color_id, created_at, size_collection_responses(quantity)",
        )
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
        .limit(GOODS_LIMIT);
      collections = (data ?? []) as typeof collections;
    }

    const productIds = [
      ...new Set(collections.map((c) => c.product_id).filter(Boolean)),
    ] as string[];
    const productMap = new Map(
      (await Promise.all(productIds.map((id) => getProductById(id))))
        .filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => [p.id, p]),
    );

    const goods = collections
      .map((c) => {
        const store = storeById.get(c.store_id);
        const product = c.product_id ? productMap.get(c.product_id) : null;
        const variant = product?.variants.find(
          (v: { id: string }) => v.id === c.design_color_id,
        );
        if (!store || !product || !variant) return null;
        const totalQuantity = (c.size_collection_responses || []).reduce(
          (s: number, r: { quantity: number }) => s + r.quantity,
          0,
        );
        return {
          storeToken: store.store_token,
          crewName: store.crew_name,
          title: c.title,
          productName: product.name,
          unitPrice: c.unit_price,
          totalQuantity,
          designLayers: c.design_snapshot ?? null,
          designColor: {
            id: variant.id,
            label: variant.label,
            hex: variant.hex,
            views: Object.fromEntries(
              product.images
                .filter((img: { colorId: string }) => img.colorId === variant.id)
                .map((img: { view: string; url: string }) => [img.view, img.url]),
            ),
          },
        };
      })
      .filter(Boolean);

    // 굿즈 수 집계(크루 카드용)
    const goodsCount = new Map<string, number>();
    for (const c of collections) {
      goodsCount.set(c.store_id, (goodsCount.get(c.store_id) ?? 0) + 1);
    }
    const crews = storeList
      .filter((s) => (goodsCount.get(s.id) ?? 0) > 0)
      .map((s) => ({
        crewName: s.crew_name,
        storeToken: s.store_token,
        goodsCount: goodsCount.get(s.id) ?? 0,
      }));

    return NextResponse.json({ success: true, data: { crews, goods } });
  } catch (error) {
    console.error("GET /api/stores/discover error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}
