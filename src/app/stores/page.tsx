/**
 * /stores — 크루 상점 둘러보기 (공개 디렉토리)
 * 크루별 굿즈 상점을 한눈에 보고 진입한다.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { Store, Package, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "크루 상점 둘러보기 — RunHouse Custom",
  description: "러닝 크루들의 커스텀 굿즈 상점을 둘러보세요.",
};

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const supabase = createServerSupabaseClient();

  const { data: stores } = await supabase
    .from("crew_stores")
    .select("id, crew_name, store_token, created_at")
    .order("created_at", { ascending: false });

  // 상점별 굿즈 수 집계
  const storeIds = (stores ?? []).map((s) => s.id);
  const goodsCount = new Map<string, number>();
  if (storeIds.length > 0) {
    const { data: cols } = await supabase
      .from("size_collections")
      .select("store_id")
      .in("store_id", storeIds);
    for (const c of cols ?? []) {
      if (c.store_id) goodsCount.set(c.store_id, (goodsCount.get(c.store_id) ?? 0) + 1);
    }
  }

  // 굿즈가 1개 이상인 상점만 노출
  const visible = (stores ?? []).filter((s) => (goodsCount.get(s.id) ?? 0) > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-20">
      <p className="text-kicker text-[#C7FF00]">· CREW STORES ·</p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl">
        크루 상점 둘러보기
      </h1>
      <p className="mt-2 text-sm text-mute sm:text-base">
        러닝 크루들의 커스텀 굿즈 상점이에요. 마음에 드는 상점을 구경해 보세요.
      </p>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-xl border border-hairline py-16 text-center text-sm text-mute">
          <Store className="mx-auto mb-2 h-8 w-8 text-hairline" />
          아직 공개된 크루 상점이 없어요.
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => {
            const initial = (s.crew_name ?? "?").trim().charAt(0) || "?";
            return (
              <Link
                key={s.id}
                href={`/store/${s.store_token}`}
                className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas p-4 transition-colors hover:border-ink"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C7FF00] text-lg font-black text-[#0B0C0A]">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">{s.crew_name}</p>
                  <p className="flex items-center gap-1 text-xs text-mute">
                    <Package className="h-3 w-3" />
                    굿즈 {goodsCount.get(s.id) ?? 0}종
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-mute transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
