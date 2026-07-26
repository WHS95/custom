/**
 * 알림 피드 (크루 운영진)
 * 별도 이벤트 테이블 없이 기존 데이터를 병합해 시간순 피드로 반환한다.
 * - 제작 리뷰 판정: manufacture_reviews.reviewed_at (approved/rejected)
 * - 내 상점 신규 주문: 내 크루 상점 굿즈들의 size_collection_responses (submission별)
 *
 * 읽음 상태는 클라이언트 localStorage(lastSeen)로 관리 — 여기선 순수 피드만.
 */

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

const FEED_LIMIT = 40;

export interface NotificationItem {
  id: string;
  type: "review_approved" | "review_rejected" | "store_order";
  title: string;
  description: string;
  createdAt: string;
  href: string;
}

export async function GET() {
  try {
    const { user, profile } = await getCurrentAuthState();
    if (!user || profile?.user_type !== "crew_staff") {
      return NextResponse.json({ success: true, data: { items: [] } });
    }

    const supabase = createServerSupabaseClient();
    const items: NotificationItem[] = [];

    // ── 1) 제작 리뷰 판정 알림 ──
    const { data: reviews } = await supabase
      .from("manufacture_reviews")
      .select("id, product_id, color_id, status, factory_comment, reviewed_at")
      .eq("creator_user_id", user.id)
      .not("reviewed_at", "is", null)
      .order("reviewed_at", { ascending: false })
      .limit(FEED_LIMIT);

    const reviewProductIds = [
      ...new Set((reviews || []).map((r) => r.product_id)),
    ];

    // ── 2) 내 상점 신규 주문 알림 ──
    const { data: store } = await supabase
      .from("crew_stores")
      .select("id, store_token")
      .eq("creator_user_id", user.id)
      .maybeSingle();

    let collections: Array<{ id: string; title: string }> = [];
    let responses: Array<{
      submission_id: string | null;
      id: string;
      name: string;
      phone_last4: string | null;
      collection_id: string;
      size: string;
      quantity: number;
      created_at: string;
    }> = [];
    if (store) {
      const { data: cols } = await supabase
        .from("size_collections")
        .select("id, title")
        .eq("store_id", store.id);
      collections = cols || [];
      const colIds = collections.map((c) => c.id);
      if (colIds.length > 0) {
        const { data: resp } = await supabase
          .from("size_collection_responses")
          .select(
            "submission_id, id, name, phone_last4, collection_id, size, quantity, created_at",
          )
          .in("collection_id", colIds)
          .order("created_at", { ascending: false })
          .limit(200);
        responses = resp || [];
      }
    }

    // 상품명 보강 (리뷰용)
    const productMap = new Map(
      (await Promise.all(reviewProductIds.map((id) => getProductById(id))))
        .filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => [p.id, p]),
    );

    for (const r of reviews || []) {
      const product = productMap.get(r.product_id);
      const approved = r.status === "approved";
      items.push({
        id: `review-${r.id}`,
        type: approved ? "review_approved" : "review_rejected",
        title: approved ? "제작 가능 승인" : "제작 불가",
        description: [
          product?.name ?? "상품",
          r.factory_comment ? `· ${r.factory_comment}` : "",
        ]
          .filter(Boolean)
          .join(" "),
        createdAt: r.reviewed_at as string,
        href: "/manufacture-reviews",
      });
    }

    // 상점 주문: submission_id별 그룹핑 (한 사람의 한 주문 = 알림 1개)
    if (store) {
      const colTitle = new Map(collections.map((c) => [c.id, c.title]));
      const groups = new Map<string, typeof responses>();
      responses.forEach((r) => {
        const key = r.submission_id ?? r.id;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(r);
      });
      for (const [key, rows] of groups) {
        const first = rows[0];
        const totalQty = rows.reduce((s, x) => s + x.quantity, 0);
        const goodsTitles = [
          ...new Set(rows.map((x) => colTitle.get(x.collection_id) ?? "굿즈")),
        ];
        const goodsLabel =
          goodsTitles.length > 1
            ? `${goodsTitles[0]} 외 ${goodsTitles.length - 1}종`
            : goodsTitles[0];
        items.push({
          id: `order-${key}`,
          type: "store_order",
          title: `새 주문 · ${first.name}`,
          description: `${goodsLabel} · ${totalQty}장`,
          createdAt: first.created_at,
          href: `/store/${store.store_token}/manage`,
        });
      }
    }

    // 시간순 정렬 + 상한
    items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      data: { items: items.slice(0, FEED_LIMIT) },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ success: true, data: { items: [] } });
  }
}
