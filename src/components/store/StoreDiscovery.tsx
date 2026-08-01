"use client";

/**
 * 크루 상점 디스커버리 — 크루 정체성 + 전체 굿즈를 마켓플레이스식으로 둘러본다.
 * 일반 사용자(크루원)에게 메인 진입점.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight, MapPin } from "lucide-react";
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
  logoUrl: string | null;
  intro: string | null;
  region: string | null;
}

const DEFAULT_INTRO = "러닝으로 함께 성장하는 크루예요.";
const DEFAULT_REGION = "활동지역 미설정";

// 카드뉴스식 배너 배경(소프트 파스텔) — 인덱스로 순환
const BANNER_BG = [
  "#FBD5DE",
  "#CDEDE9",
  "#E7E0F7",
  "#FDE8CC",
  "#D8EAD3",
  "#D6E4F5",
];

const won = (n: number | null) => (n != null ? n.toLocaleString("ko-KR") + "원" : "");

function GoodsPreview({ g, bare = false }: { g: Goods; bare?: boolean }) {
  const layers = g.designLayers ?? [];
  const view: HatView = useMemo(() => {
    const views = layers.map((l) => l.view);
    return (views.includes("front") ? "front" : views[0]) as HatView;
  }, [layers]);
  return (
    <div
      className={
        bare
          ? "h-full w-full"
          : "aspect-square overflow-hidden rounded-xl bg-soft-cloud"
      }
    >
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

  // 크루별 대표 굿즈(첫 굿즈) — 배너 이미지용
  const featuredByStore = useMemo(() => {
    const m = new Map<string, Goods>();
    for (const g of goods) if (!m.has(g.storeToken)) m.set(g.storeToken, g);
    return m;
  }, [goods]);

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
          {/* 크루 상점 — 카드뉴스식 배너 캐러셀 */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink">크루 상점</h2>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [&::-webkit-scrollbar]:hidden">
              {crews.map((c, i) => {
                const featured = featuredByStore.get(c.storeToken) ?? null;
                return (
                  <Link
                    key={c.storeToken}
                    href={`/store/${c.storeToken}`}
                    className="group relative flex aspect-[3/4] w-[260px] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-2xl p-5 sm:w-[300px]"
                    style={{ backgroundColor: BANNER_BG[i % BANNER_BG.length] }}
                  >
                    {/* eyebrow */}
                    <span className="absolute left-5 top-5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B0C0A]/70">
                      CREW STORE
                    </span>
                    {/* 대표 굿즈(시안) 플로팅 */}
                    {featured?.designLayers && featured.designLayers.length > 0 && (
                      <div className="pointer-events-none absolute inset-x-6 top-10 bottom-24 transition-transform duration-300 group-hover:-translate-y-1">
                        <GoodsPreview g={featured} bare />
                      </div>
                    )}
                    {/* 로고 */}
                    {c.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="absolute right-5 top-4 h-10 w-10 rounded-full border-2 border-white/70 object-cover"
                      />
                    )}
                    {/* 텍스트 */}
                    <div className="relative">
                      <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-[#0B0C0A]/70">
                        <MapPin className="h-3 w-3" />
                        {c.region?.trim() || DEFAULT_REGION}
                      </p>
                      <p className="font-display text-2xl font-black leading-tight text-[#0B0C0A]">
                        {c.crewName}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-[#0B0C0A]/70">
                        {c.intro?.trim() || DEFAULT_INTRO}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-[11px] text-[#0B0C0A]/60">
                        <Package className="h-3 w-3" /> 굿즈 {c.goodsCount}종
                        <ArrowRight className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </p>
                    </div>
                  </Link>
                );
              })}
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
