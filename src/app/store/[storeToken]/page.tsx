"use client";

/**
 * 크루 스토어 — 크루 전용 커스텀 굿즈 샵 (크리에이터 샵 프로필 레이아웃)
 * 배너(크루 프로필) → 탭바 → 굿즈 상품 그리드
 */

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Settings, Users, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";
import { cn } from "@/lib/utils";
import {
  StoreOrderFlow,
  type OrderableProduct,
  type StoreCart,
} from "@/components/store/StoreOrderFlow";

interface StoreProduct {
  token: string;
  adminToken?: string;
  title: string;
  status: "open" | "closed" | "ordered";
  unitPrice?: number;
  sizes: string[];
  responseCount: number;
  totalQuantity: number;
  productName?: string;
  designLayers: DesignLayer[] | null;
  designColor: {
    id: string;
    label: string;
    hex: string;
    views: Record<string, string>;
  } | null;
}

interface StoreData {
  crewName: string;
  isOwner: boolean;
  storeOpen: boolean;
  openFrom: string | null;
  openUntil: string | null;
  products: StoreProduct[];
}

export default function CrewStorePage({
  params,
}: {
  params: Promise<{ storeToken: string }>;
}) {
  const { storeToken } = use(params);
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // 주문 흐름 상태
  const [cart, setCart] = useState<StoreCart>({});
  const [selectedProduct, setSelectedProduct] = useState<OrderableProduct | null>(null);
  const [myOrdersOpen, setMyOrdersOpen] = useState(false);

  const reload = useCallback(() => {
    fetch(`/api/store/${storeToken}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [storeToken]);

  useEffect(() => {
    reload();
  }, [reload]);

  const totalMembers = useMemo(
    () => (data?.products || []).reduce((s, p) => s + p.responseCount, 0),
    [data],
  );
  // 참여 최다 상품 = 인기 뱃지
  const popularToken = useMemo(() => {
    const open = (data?.products || []).filter((p) => p.totalQuantity > 0);
    if (open.length === 0) return null;
    return open.reduce((a, b) => (b.totalQuantity > a.totalQuantity ? b : a)).token;
  }, [data]);

  const copyStoreLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/store/${storeToken}`,
    );
    toast.success("스토어 링크가 복사되었습니다.");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center">
        <p className="text-lg font-medium">스토어를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          링크가 정확한지 다시 확인해주세요.
        </p>
      </div>
    );
  }

  const initial = data.crewName.trim().charAt(0).toUpperCase() || "C";

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── 프로필 배너 ── */}
      <div className="relative overflow-hidden bg-[#0B0C0A] text-white">
        {/* 은은한 크루 워터마크 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden pr-4 opacity-[0.07]"
        >
          <span className="whitespace-nowrap font-display text-[7rem] font-black tracking-tight sm:text-[10rem]">
            {data.crewName}
          </span>
        </div>

        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:gap-6 sm:py-10">
          {/* 크루 아바타 */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-[#C7FF00] text-3xl font-black text-[#0B0C0A] sm:h-24 sm:w-24">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{data.crewName}</h1>
              <span className="rounded-[4px] bg-[#C7FF00] px-1.5 py-0.5 text-[10px] font-extrabold tracking-[0.15em] text-[#0B0C0A]">
                CREW STORE
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              {data.crewName} 운영진이 직접 디자인한 우리 크루 전용 커스텀
              굿즈입니다. 원하는 상품을 골라 사이즈를 등록하세요.
            </p>
            {(data.openFrom || data.openUntil) && (
              <p className="mt-2 font-mono text-xs text-white/60">
                {data.storeOpen ? (
                  <span className="text-[#C7FF00]">운영 중</span>
                ) : (
                  <span className="text-white/80">운영 종료</span>
                )}{" "}
                · {data.openFrom?.replaceAll("-", ".") ?? ""} –{" "}
                {data.openUntil?.replaceAll("-", ".") ?? ""}
              </p>
            )}
          </div>

          {/* 참여 카운트 */}
          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-white/20 bg-white/5 px-4 py-2 sm:self-center">
            <Users className="h-4 w-4 text-[#C7FF00]" />
            <span className="text-sm font-semibold">{totalMembers.toLocaleString()}</span>
            <span className="text-xs text-white/60">명 참여</span>
          </div>
        </div>
      </div>

      {/* ── 탭바 ── */}
      <div className="sticky top-16 z-40 border-b border-hairline bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
          <div className="flex gap-6">
            <button className="border-b-2 border-ink py-3 text-sm font-bold">
              샵홈
            </button>
            <span className="py-3 text-sm text-muted-foreground">
              굿즈 <sup className="text-xs">{data.products.length}</sup>
            </span>
          </div>
          <div className="flex gap-2 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMyOrdersOpen(true)}
            >
              <PackageSearch className="h-4 w-4" /> 내 주문
            </Button>
            {data.isOwner && (
              <>
                <Button variant="outline" size="sm" onClick={copyStoreLink}>
                  <Copy className="h-4 w-4" /> 링크 복사
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/store/${storeToken}/manage`}>
                    <Settings className="h-4 w-4" /> 상점 관리
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 굿즈 상품 ── */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-xl font-bold">굿즈 상품</h2>
          <span className="text-sm text-muted-foreground">
            {data.products.length}개
          </span>
        </div>

        {data.products.length === 0 ? (
          <div className="rounded-xl border border-hairline py-16 text-center text-muted-foreground">
            아직 등록된 상품이 없습니다.
            {data.isOwner && (
              <p className="mt-2 text-sm">
                스튜디오에서 디자인 후 &lsquo;우리 크루 상품으로 등록&rsquo;을
                눌러보세요.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {data.products.map((p) => {
              const isPopular = p.token === popularToken;
              const closed = p.status !== "open";
              const card = (
                <div className="group">
                  {/* 이미지 타일 */}
                  <div className="relative overflow-hidden rounded-xl bg-soft-cloud transition group-hover:shadow-md">
                    {isPopular && (
                      <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-[#FF6F1E] px-2 py-1 text-xs font-bold text-white">
                        인기
                      </span>
                    )}
                    {closed && (
                      <span className="absolute right-2.5 top-2.5 z-10 rounded-md bg-ink/80 px-2 py-1 text-xs font-bold text-white">
                        {p.status === "ordered" ? "주문 완료" : "마감"}
                      </span>
                    )}
                    {p.designLayers && p.designColor ? (
                      <div className={cn("p-4 transition group-hover:scale-[1.03]", closed && "opacity-60")}>
                        <HatDesignCanvas
                          hatColor={p.designColor.id}
                          currentView={"front" as HatView}
                          layers={p.designLayers}
                          editable={false}
                          showSafeZone={false}
                          showViewLabel={false}
                          productColors={[
                            {
                              id: p.designColor.id,
                              label: p.designColor.label,
                              hex: p.designColor.hex,
                              views: p.designColor.views as Record<HatView, string>,
                            },
                          ]}
                          className="aspect-square w-full"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-sm text-muted-foreground">
                        미리보기 없음
                      </div>
                    )}
                    {data.isOwner && p.adminToken && (
                      <Link
                        href={`/collect/${p.token}/manage?key=${p.adminToken}`}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-2.5 right-2.5 z-10 rounded-full bg-white/90 p-2 text-ink shadow-sm transition hover:bg-white"
                        title="상품 관리"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="mt-2.5 space-y-1 px-0.5">
                    <p className="line-clamp-2 text-sm leading-snug">
                      [{data.crewName}] {p.title}
                    </p>
                    {p.unitPrice != null && (
                      <p className="text-base font-bold">
                        {p.unitPrice.toLocaleString()}원
                      </p>
                    )}
                    {p.responseCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {p.responseCount}명 참여 · {p.totalQuantity}장
                      </p>
                    )}
                    {cart[p.token] &&
                      Object.values(cart[p.token]).some((q) => q > 0) && (
                        <p className="text-xs font-bold text-success">
                          담김 ·{" "}
                          {Object.values(cart[p.token]).reduce((s, q) => s + q, 0)}
                          장 ✓
                        </p>
                      )}
                  </div>
                </div>
              );

              return closed || !data.storeOpen ? (
                <div key={p.token}>{card}</div>
              ) : (
                <button
                  key={p.token}
                  type="button"
                  className="text-left"
                  onClick={() =>
                    setSelectedProduct({
                      token: p.token,
                      title: p.title,
                      unitPrice: p.unitPrice,
                      sizes: p.sizes,
                    })
                  }
                >
                  {card}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 운영 종료 안내 */}
      {!data.storeOpen && (
        <div className="mx-auto max-w-6xl px-4 pb-8">
          <div className="rounded-xl border border-hairline bg-soft-cloud p-4 text-center text-sm text-muted-foreground">
            상점 운영이 종료되어 새 주문을 받지 않습니다.
          </div>
        </div>
      )}

      {/* ── 주문 흐름 (시트·카트바) ── */}
      <StoreOrderFlow
        storeToken={storeToken}
        products={data.products
          .filter((p) => p.status === "open")
          .map((p) => ({
            token: p.token,
            title: p.title,
            unitPrice: p.unitPrice,
            sizes: p.sizes,
          }))}
        selected={selectedProduct}
        onCloseProduct={() => setSelectedProduct(null)}
        cart={cart}
        setCart={setCart}
        onOrderComplete={reload}
        myOrdersOpen={myOrdersOpen}
        setMyOrdersOpen={setMyOrdersOpen}
      />
    </div>
  );
}
