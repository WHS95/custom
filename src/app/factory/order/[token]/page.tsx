"use client";

/**
 * 공장 제작 주문 확인 페이지 (공개 — 토큰 링크)
 * 크루 스토어 주문 확정 시 발급된 factory_token으로 진입.
 * 굿즈(디자인)별 시안 상세(폰트·크기·로고·커스텀·시안 다운) + 사이즈·수량 + 배송지.
 */
import { use, useEffect, useState } from "react";
import { Package, Truck, Layers } from "lucide-react";
import type { DesignLayer } from "@/components/shared/HatDesignCanvas";
import { DesignReviewDetail } from "@/components/shared/DesignReviewDetail";
import type { PrintArea } from "@/lib/print-spec";
import { Spinner } from "@/components/ui/spinner";

interface Group {
  productName: string;
  colorLabel: string;
  totalQuantity: number;
  personalized: boolean;
  roster:
    | { customName: string; realName: string; size: string; quantity: number }[]
    | null;
  sizes: { size: string; quantity: number }[] | null;
  designLayers: DesignLayer[] | null;
  printAreas?: Record<string, PrintArea>;
  designColor: {
    id: string;
    label: string;
    hex: string;
    views: Record<string, string>;
  } | null;
}
interface OrderData {
  orderNumber: string;
  createdAt: string;
  status: string;
  shipping: {
    recipientName?: string;
    phone?: string;
    address?: string;
    addressDetail?: string;
    organizationName?: string;
    memo?: string;
  } | null;
  groups: Group[];
}

export default function FactoryOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/factory/order/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-ink" />
      </div>
    );
  }
  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium">주문을 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          링크가 정확한지 확인해 주세요.
        </p>
      </div>
    );
  }

  const totalQty = data.groups.reduce((s, g) => s + g.totalQuantity, 0);
  const shippingLine = data.shipping
    ? [data.shipping.address, data.shipping.addressDetail].filter(Boolean).join(" ")
    : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-20">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          제작 주문 확인
        </div>
        <h1 className="mt-1 text-2xl font-bold">주문 {data.orderNumber}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {new Date(data.createdAt).toLocaleString("ko-KR")} · 굿즈 {data.groups.length}종
          · 총 {totalQty}장
        </p>
      </div>

      {/* 배송지 */}
      {data.shipping && (
        <div className="mb-6 rounded-xl border border-hairline p-4">
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <Truck className="h-4 w-4" /> 배송지
          </div>
          <div className="space-y-0.5 text-sm text-charcoal">
            <p>
              <span className="text-muted-foreground">받는 분</span>{" "}
              {data.shipping.recipientName || "-"}
              {data.shipping.phone ? ` · ${data.shipping.phone}` : ""}
            </p>
            <p>
              <span className="text-muted-foreground">주소</span> {shippingLine || "-"}
            </p>
            {data.shipping.organizationName && (
              <p>
                <span className="text-muted-foreground">크루</span>{" "}
                {data.shipping.organizationName}
              </p>
            )}
            {data.shipping.memo && (
              <p className="text-muted-foreground">{data.shipping.memo}</p>
            )}
          </div>
        </div>
      )}

      {/* 굿즈별 시안 + 사이즈·수량 */}
      <div className="space-y-8">
        {data.groups.map((g, i) => (
          <section key={i} className="rounded-xl border border-hairline p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" /> 굿즈 {i + 1}
                </div>
                <h2 className="mt-0.5 font-bold">{g.productName}</h2>
                <p className="text-sm text-muted-foreground">
                  색상 {g.colorLabel} · 총 {g.totalQuantity}장
                </p>
              </div>
            </div>

            {/* 시안 상세 (폰트·크기·로고·커스텀·시안 다운) */}
            <DesignReviewDetail
              designLayers={g.designLayers}
              designColor={g.designColor}
              printAreas={g.printAreas}
              size="sm"
            />

            {/* 개인화: 사람별 명단 / 일반: 사이즈별 수량 */}
            {g.personalized && g.roster ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">
                  크루원별 명단 · 새길 이름{" "}
                  <span className="text-muted-foreground">({g.roster.length}명)</span>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline text-left text-muted-foreground">
                        <th className="py-1.5 font-medium">새길 이름</th>
                        <th className="py-1.5 font-medium">사이즈</th>
                        <th className="py-1.5 text-right font-medium">수량</th>
                        <th className="py-1.5 pl-3 font-medium">주문자</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.roster.map((r, ri) => (
                        <tr key={ri} className="border-b border-hairline-soft">
                          <td className="py-1.5 font-bold">{r.customName || "-"}</td>
                          <td className="py-1.5">{r.size}</td>
                          <td className="py-1.5 text-right">{r.quantity}장</td>
                          <td className="py-1.5 pl-3 text-muted-foreground">
                            {r.realName}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-1.5 font-semibold" colSpan={2}>
                          합계
                        </td>
                        <td className="py-1.5 text-right font-bold">
                          {g.totalQuantity}장
                        </td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  ※ 개인화 굿즈 — 각 항목의 &lsquo;새길 이름&rsquo;을 디자인의 이름 자리에 새겨 제작해요.
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">사이즈별 수량</p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead>
                      <tr className="border-b border-hairline text-left text-muted-foreground">
                        <th className="py-1.5 font-medium">사이즈</th>
                        <th className="py-1.5 text-right font-medium">수량</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(g.sizes ?? []).map((s) => (
                        <tr key={s.size} className="border-b border-hairline-soft">
                          <td className="py-1.5">{s.size}</td>
                          <td className="py-1.5 text-right font-medium">
                            {s.quantity}장
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="py-1.5 font-semibold">합계</td>
                        <td className="py-1.5 text-right font-bold">
                          {g.totalQuantity}장
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
