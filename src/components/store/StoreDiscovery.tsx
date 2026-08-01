"use client";

/**
 * 크루 상점 디스커버리 — 크루 정체성 + 전체 굿즈를 마켓플레이스식으로 둘러본다.
 * 일반 사용자(크루원)에게 메인 진입점.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";
import { Spinner } from "@/components/ui/spinner";

interface DesignColor {
  id: string;
  label: string;
  hex: string;
  views: Record<string, string>;
}
interface Goods {
  storeToken: string;
  crewName: string;
  title: string;
  productName: string;
  unitPrice: number | null;
  totalQuantity: number;
  designLayers: DesignLayer[] | null;
  designColor: DesignColor;
}
interface Crew {
  crewName: string;
  storeToken: string;
  goodsCount: number;
}

const won = (n: number | null) => (n != null ? n.toLocaleString("ko-KR") + "원" : "");

function GoodsPreview({ g }: { g: Goods }) {
  const layers = g.designLayers ?? [];
  const view: HatView = useMemo(() => {
    const views = layers.map((l) => l.view);
    return (views.includes("front") ? "front" : views[0]) as HatView;
  }, [layers]);
  return (
    <div className="aspect-square overflow-hidden rounded-xl bg-soft-cloud">
      {layers.length > 0 ? (
        <HatDesignCanvas
          hatColor={g.designColor.id}
          currentView={view ?? "front"}
          layers={layers}
          editable={false}
          showSafeZone={false}
          showViewLabel={false}
          productColors={[
            {
              id: g.designColor.id,
              label: g.designColor.label,
              hex: g.designColor.hex,
              views: g.designColor.views as Record<HatView, string>,
            },
          ]}
          className="h-full w-full"
        />
      ) : null}
    </div>
  );
}

export function StoreDiscovery() {
  const [crews, setCrews] = useState<Crew[] | null>(null);
  const [goods, setGoods] = useState<Goods[]>([]);

  useEffect(() => {
    fetch("/api/stores/discover")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setCrews(j.data.crews);
          setGoods(j.data.goods);
        } else setCrews([]);
      })
      .catch(() => setCrews([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pb-24">
      <p className="text-kicker text-[#C7FF00]">· CREW STORES ·</p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl">
        크루 상점 둘러보기
      </h1>
      <p className="mt-2 text-sm text-mute sm:text-base">
        러닝 크루들의 아이덴티티와 커스텀 굿즈를 만나보세요.
      </p>

      {crews === null ? (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-ink" />
        </div>
      ) : crews.length === 0 ? (
        <div className="mt-10 rounded-xl border border-hairline py-16 text-center text-sm text-mute">
          아직 공개된 크루 상점이 없어요.
        </div>
      ) : (
        <>
          {/* 크루 상점 (정체성) */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink">크루 상점</h2>
            <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
              {crews.map((c) => (
                <Link
                  key={c.storeToken}
                  href={`/store/${c.storeToken}`}
                  className="group flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border border-hairline p-4 transition-colors hover:border-ink"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C7FF00] text-xl font-black text-[#0B0C0A]">
                    {(c.crewName ?? "?").trim().charAt(0) || "?"}
                  </span>
                  <span className="w-full truncate text-center text-sm font-bold text-ink">
                    {c.crewName}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-mute">
                    <Package className="h-3 w-3" /> 굿즈 {c.goodsCount}종
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* 크루 굿즈 */}
          <section className="mt-10">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-lg font-bold text-ink">크루 굿즈</h2>
              <span className="text-xs text-mute">{goods.length}개</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {goods.map((g, i) => (
                <Link
                  key={`${g.storeToken}-${i}`}
                  href={`/store/${g.storeToken}`}
                  className="group"
                >
                  <GoodsPreview g={g} />
                  <div className="mt-2">
                    <p className="truncate text-xs text-mute">[{g.crewName}]</p>
                    <p className="truncate text-sm font-medium text-ink">{g.title}</p>
                    <p className="text-sm font-bold text-ink">{won(g.unitPrice)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
