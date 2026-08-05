"use client";

/**
 * 크루 상점 디스커버리 — 크루 정체성 + 전체 굿즈를 마켓플레이스식으로 둘러본다.
 * 일반 사용자(크루원)에게 메인 진입점.
 */
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Package, ArrowRight, MapPin } from "lucide-react";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";
import { Skeleton } from "@/components/ui/skeleton";

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
        <>
          {/* 실제 레이아웃을 미러링한 스켈레톤 — 스피너보다 체감 로딩이 빠르다 */}
          <section className="mt-8">
            <Skeleton className="mb-3 h-6 w-20 rounded-md" />
            <div className="grid gap-4 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))}
            </div>
          </section>
          <section className="mt-10">
            <Skeleton className="mb-3 h-6 w-24 rounded-md" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="mt-2 h-3 w-16 rounded" />
                  <Skeleton className="mt-1.5 h-4 w-28 rounded" />
                </div>
              ))}
            </div>
          </section>
        </>
      ) : crews.length === 0 ? (
        <div className="mt-10 rounded-xl border border-hairline py-16 text-center text-sm text-mute">
          아직 공개된 크루 상점이 없어요.
        </div>
      ) : (
        <>
          {/* 크루 상점 — 다크 아이덴티티 배너 카드 */}
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink">크루 상점</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {crews.map((c, i) => (
                <Link
                  key={c.storeToken}
                  href={`/store/${c.storeToken}`}
                  className="group stagger-item relative overflow-hidden rounded-2xl bg-ink p-5 text-canvas transition-transform duration-150 ease-out active:scale-[0.98]"
                  style={{ "--stagger-i": i } as CSSProperties}
                >
                  {/* 워터마크 크루명 */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-2 bottom-0 select-none font-display text-6xl font-black leading-none tracking-tight text-white/[0.05] sm:text-7xl"
                  >
                    {c.crewName}
                  </span>
                  <div className="relative flex items-start gap-4">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#C7FF00] text-2xl font-black text-[#0B0C0A]">
                        {(c.crewName ?? "?").trim().charAt(0) || "?"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-display text-xl font-black text-canvas">
                          {c.crewName}
                        </span>
                        <span className="shrink-0 rounded-[4px] bg-[#C7FF00] px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.1em] text-[#0B0C0A]">
                          CREW STORE
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-stone">
                        {c.intro?.trim() || DEFAULT_INTRO}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-stone/80">
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {c.region?.trim() || DEFAULT_REGION}
                        </span>
                        <span className="text-white/20">·</span>
                        <span className="inline-flex items-center gap-0.5">
                          <Package className="h-3 w-3" /> 굿즈 {c.goodsCount}종
                        </span>
                        <ArrowRight className="ml-auto h-4 w-4 text-stone transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
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
                  className="group stagger-item transition-transform duration-150 ease-out active:scale-[0.98]"
                  style={{ "--stagger-i": Math.min(i, 11) } as CSSProperties}
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
