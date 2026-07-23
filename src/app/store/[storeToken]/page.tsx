"use client";

/**
 * 크루 스토어 — 크루 전용 커스텀 상품 상점
 * 운영진이 스튜디오에서 등록한 상품들을 크루원이 보고 주문 등록
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Store, Copy, Settings, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";

interface StoreProduct {
  token: string;
  adminToken?: string;
  title: string;
  status: "open" | "closed" | "ordered";
  unitPrice?: number;
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
  products: StoreProduct[];
}

const STATUS_LABEL = {
  open: "판매 중",
  closed: "마감",
  ordered: "주문 완료",
} as const;

export default function CrewStorePage({
  params,
}: {
  params: Promise<{ storeToken: string }>;
}) {
  const { storeToken } = use(params);
  const [data, setData] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/store/${storeToken}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [storeToken]);

  const copyStoreLink = async () => {
    await navigator.clipboard.writeText(
      `${window.location.origin}/store/${storeToken}`,
    );
    toast.success("스토어 링크가 복사되었습니다.");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg font-medium">스토어를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          링크가 정확한지 다시 확인해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-kicker text-sm text-muted-foreground">CREW STORE</p>
        <h1 className="mt-1 flex items-center justify-center gap-2 text-3xl font-bold">
          <Store className="h-7 w-7" />
          {data.crewName}
        </h1>
        <p className="mt-2 text-muted-foreground">
          우리 크루만의 커스텀 굿즈 — 원하는 상품을 골라 사이즈를 등록하세요.
        </p>
        {data.isOwner && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={copyStoreLink}>
              <Copy className="h-4 w-4" /> 스토어 링크 복사
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Plus className="h-4 w-4" /> 상품 추가하러 가기
              </Link>
            </Button>
          </div>
        )}
      </div>

      {data.products.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            아직 등록된 상품이 없습니다.
            {data.isOwner && " 스튜디오에서 디자인 후 '우리 크루 상품으로 등록'을 눌러보세요."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {data.products.map((p) => (
            <Card key={p.token} className="overflow-hidden">
              <CardContent className="pt-6 space-y-3">
                {p.designLayers && p.designColor ? (
                  <div className="mx-auto w-full max-w-60">
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
                      className="aspect-square w-full rounded-lg border border-hairline"
                    />
                  </div>
                ) : (
                  <div className="mx-auto flex aspect-square w-full max-w-60 items-center justify-center rounded-lg bg-soft-cloud text-sm text-muted-foreground">
                    미리보기 없음
                  </div>
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.designColor?.label}
                      {p.unitPrice != null && (
                        <span className="ml-2 font-medium text-ink">
                          {p.unitPrice.toLocaleString()}원
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge>{STATUS_LABEL[p.status]}</Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  {p.responseCount}명 참여 · {p.totalQuantity}장
                </p>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={p.status !== "open"}
                    asChild={p.status === "open"}
                  >
                    {p.status === "open" ? (
                      <Link href={`/collect/${p.token}`}>주문 등록하기</Link>
                    ) : (
                      <span>{STATUS_LABEL[p.status]}</span>
                    )}
                  </Button>
                  {data.isOwner && p.adminToken && (
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/collect/${p.token}/manage?key=${p.adminToken}`}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
