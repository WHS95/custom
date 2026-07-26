"use client";

/**
 * 크루 스토어 관리 페이지 (운영진 = store owner 전용)
 *
 * 탭 4개:
 * - 취합 현황: 주문자별(수정·삭제·추가) / 상품별 집계 보기 + 주문 넣기(개별·전체)
 * - 주문 진행: 전환된 주문의 진행 상태 (orders 조인)
 * - 굿즈: 제목·가격·마감일 수정, 마감/재오픈/삭제
 * - 설정: 상점 운영기간, 링크 복사
 *
 * 입금 관리는 하지 않는다 — 취합은 확인용, 돈은 크루가 오프라인에서 처리.
 */

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface ManageResponse {
  id: string;
  name: string;
  phoneLast4: string | null;
  submissionId: string | null;
  colorId: string | null;
  size: string;
  quantity: number;
  note: string | null;
  createdAt: string;
}

interface ManageProduct {
  token: string;
  adminToken: string;
  title: string;
  status: "open" | "closed" | "ordered";
  unitPrice: number | null;
  deadline: string | null;
  orderNumber: string | null;
  createdAt: string;
  responses: ManageResponse[];
}

interface ConvertedOrder {
  order_number: string;
  status: string;
  total_amount: number;
  shipping_info: { address?: string; addressDetail?: string } | null;
  created_at: string;
}

interface ManageData {
  crewName: string;
  storeToken: string;
  openFrom: string | null;
  openUntil: string | null;
  products: ManageProduct[];
  orders: ConvertedOrder[];
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";
const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "접수됨",
  confirmed: "확인됨",
  in_production: "제작 중",
  producing: "제작 중",
  shipped: "배송 중",
  shipping: "배송 중",
  delivered: "배송 완료",
  completed: "완료",
  cancelled: "취소됨",
};

/** 주문자(submission) 그룹 */
interface BuyerGroup {
  key: string;
  name: string;
  phoneLast4: string | null;
  createdAt: string;
  lines: Array<{
    productToken: string;
    title: string;
    unitPrice: number;
    size: string;
    quantity: number;
  }>;
  total: number;
  editable: boolean; // 전환된 굿즈가 섞이면 수정 불가
}

export default function StoreManagePage({
  params,
}: {
  params: Promise<{ storeToken: string }>;
}) {
  const { storeToken } = use(params);
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const reload = useCallback(() => {
    fetch(`/api/store/${storeToken}/manage`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setDenied(true);
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, [storeToken]);

  useEffect(() => {
    if (!authLoading) reload();
  }, [authLoading, reload]);

  // ── 주문자별 그룹핑 ──
  const buyers = useMemo((): BuyerGroup[] => {
    if (!data) return [];
    const groups = new Map<string, BuyerGroup>();
    data.products.forEach((p) => {
      p.responses.forEach((r) => {
        const key = r.submissionId ?? r.id;
        if (!groups.has(key)) {
          groups.set(key, {
            key,
            name: r.name,
            phoneLast4: r.phoneLast4,
            createdAt: r.createdAt,
            lines: [],
            total: 0,
            editable: true,
          });
        }
        const g = groups.get(key)!;
        g.lines.push({
          productToken: p.token,
          title: p.title,
          unitPrice: p.unitPrice ?? 0,
          size: r.size,
          quantity: r.quantity,
        });
        g.total += (p.unitPrice ?? 0) * r.quantity;
        if (p.status === "ordered") g.editable = false;
      });
    });
    return [...groups.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [data]);

  const openProducts = useMemo(
    () => (data?.products || []).filter((p) => p.status === "open"),
    [data],
  );
  const summary = useMemo(() => {
    const people = buyers.length;
    let count = 0;
    let amount = 0;
    buyers.forEach((b) =>
      b.lines.forEach((l) => {
        count += l.quantity;
        amount += l.unitPrice * l.quantity;
      }),
    );
    return { people, count, amount };
  }, [buyers]);

  // ── 상태: 보기 전환, 시트들 ──
  const [view, setView] = useState<"buyer" | "product">("buyer");
  const [editBuyer, setEditBuyer] = useState<BuyerGroup | null>(null);
  const [addingBuyer, setAddingBuyer] = useState(false);
  const [convertAllOpen, setConvertAllOpen] = useState(false);

  // ── 주문자 삭제 ──
  const deleteBuyer = async (b: BuyerGroup) => {
    if (!confirm(`${b.name}(${b.phoneLast4 ?? "-"})의 주문을 삭제할까요?`)) return;
    try {
      const res = await fetch(
        `/api/store/${storeToken}/orders?submissionId=${b.key}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "삭제 실패");
      toast.success("삭제되었습니다.");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (denied || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-lg font-medium">상점 관리 권한이 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {isAuthenticated
            ? "이 상점의 운영진 계정으로 로그인했는지 확인해주세요."
            : "크루 계정으로 로그인해주세요."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={`/store/${storeToken}`}>상점으로 돌아가기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href={`/store/${storeToken}`}
            className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-ink"
          >
            <ArrowLeft className="h-3 w-3" /> 상점으로
          </Link>
          <h1 className="text-xl font-bold">{data.crewName} 상점 관리</h1>
        </div>
      </div>

      <Tabs defaultValue="status">
        <TabsList className="w-full">
          <TabsTrigger value="status" className="flex-1">취합 현황</TabsTrigger>
          <TabsTrigger value="progress" className="flex-1">주문 진행</TabsTrigger>
          <TabsTrigger value="goods" className="flex-1">굿즈</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1">설정</TabsTrigger>
        </TabsList>

        {/* ══ 취합 현황 ══ */}
        <TabsContent value="status" className="mt-4">
          {/* 요약 타일 */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: summary.people, k: "참여 인원" },
              { v: summary.count, k: "총 수량(장)" },
              { v: summary.amount.toLocaleString(), k: "총 금액(원)" },
            ].map((t) => (
              <div key={t.k} className="rounded-lg bg-soft-cloud p-3 text-center">
                <p className="font-mono text-lg font-extrabold">{t.v}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{t.k}</p>
              </div>
            ))}
          </div>

          {/* 보기 전환 */}
          <div className="my-3 flex gap-1.5">
            <button
              onClick={() => setView("buyer")}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${view === "buyer" ? "border-ink bg-ink text-canvas" : "border-hairline text-muted-foreground"}`}
            >
              주문자별
            </button>
            <button
              onClick={() => setView("product")}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${view === "product" ? "border-ink bg-ink text-canvas" : "border-hairline text-muted-foreground"}`}
            >
              상품별 집계
            </button>
          </div>

          {view === "buyer" ? (
            <div className="space-y-2.5">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setAddingBuyer(true)}
                disabled={openProducts.length === 0}
              >
                <Plus className="h-4 w-4" /> 주문자 직접 추가 (현장 접수분)
              </Button>
              {buyers.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  아직 주문이 없습니다.
                </p>
              )}
              {buyers.map((b) => (
                <div
                  key={b.key}
                  className="overflow-hidden rounded-xl border border-hairline-soft"
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="text-sm font-bold">
                      {b.name}{" "}
                      <span className="font-mono text-xs font-normal text-muted-foreground">
                        · {b.phoneLast4 ?? "-"}
                      </span>
                    </span>
                    {b.editable ? (
                      <span className="flex gap-1.5">
                        <button
                          onClick={() => setEditBuyer(b)}
                          className="rounded-md border border-hairline px-2.5 py-1 text-[11px] font-bold"
                        >
                          <Pencil className="mr-0.5 inline h-3 w-3" /> 수정
                        </button>
                        <button
                          onClick={() => deleteBuyer(b)}
                          className="rounded-md border border-danger px-2.5 py-1 text-[11px] font-bold text-danger"
                        >
                          <Trash2 className="mr-0.5 inline h-3 w-3" /> 삭제
                        </button>
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-muted-foreground">
                        주문 확정됨
                      </span>
                    )}
                  </div>
                  {b.lines.map((l, i) => (
                    <div
                      key={i}
                      className="flex justify-between border-t border-hairline-soft px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      <span className="truncate pr-2">{l.title}</span>
                      <span className="shrink-0 font-mono">
                        {l.size}×{l.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-hairline-soft px-3 py-1.5 text-xs">
                    <span className="font-bold">합계</span>
                    <span className="font-mono font-extrabold">{won(b.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {openProducts.length > 1 && (
                <Button
                  className="w-full bg-[#C7FF00] font-extrabold text-[#0B0C0A] hover:bg-[#b8ef00]"
                  onClick={() => setConvertAllOpen(true)}
                >
                  전체 주문 넣기 — {openProducts.length}종 한 번에
                </Button>
              )}
              {data.products.map((p) => {
                // 색상×사이즈 집계
                const agg = new Map<string, number>();
                p.responses.forEach((r) => {
                  agg.set(r.size, (agg.get(r.size) ?? 0) + r.quantity);
                });
                const total = [...agg.values()].reduce((s, q) => s + q, 0);
                return (
                  <div
                    key={p.token}
                    className="rounded-xl border border-hairline-soft p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate pr-2 text-sm font-bold">{p.title}</span>
                      <span className="shrink-0 font-mono text-xs">
                        {total}장
                        {p.status !== "open" && (
                          <span className="ml-1.5 text-muted-foreground">
                            · {p.status === "ordered" ? "주문됨" : "마감"}
                          </span>
                        )}
                      </span>
                    </div>
                    {agg.size > 0 && (
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full border-collapse text-center font-mono text-xs">
                          <tbody>
                            <tr>
                              <th className="border border-hairline-soft bg-soft-cloud px-2 py-1 font-bold">
                                사이즈
                              </th>
                              {[...agg.keys()].map((s) => (
                                <th
                                  key={s}
                                  className="border border-hairline-soft bg-soft-cloud px-2 py-1 font-bold"
                                >
                                  {s}
                                </th>
                              ))}
                            </tr>
                            <tr>
                              <td className="border border-hairline-soft px-2 py-1">수량</td>
                              {[...agg.entries()].map(([s, q]) => (
                                <td key={s} className="border border-hairline-soft px-2 py-1">
                                  {q}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    {p.status === "open" && total > 0 && (
                      <Button asChild variant="outline" className="mt-2.5 h-9 w-full">
                        <Link href={`/collect/${p.token}/manage?key=${p.adminToken}`}>
                          이 굿즈만 주문 넣기 →
                        </Link>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══ 주문 진행 ══ */}
        <TabsContent value="progress" className="mt-4 space-y-2.5">
          {data.orders.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              아직 주문을 넣은 굿즈가 없습니다.
              <br />
              취합 현황 → 상품별 집계에서 주문을 넣어보세요.
            </p>
          ) : (
            data.orders.map((o) => {
              const relatedTitles = data.products
                .filter((p) => p.orderNumber === o.order_number)
                .map((p) => p.title);
              return (
                <div
                  key={o.order_number}
                  className="overflow-hidden rounded-xl border border-hairline-soft"
                >
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <span className="truncate pr-2 text-sm font-bold">
                      {relatedTitles.join(", ") || "주문"}
                    </span>
                    <span className="shrink-0 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-canvas">
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                  </div>
                  {[
                    ["주문번호", o.order_number],
                    ["금액", won(o.total_amount)],
                    [
                      "배송지",
                      [o.shipping_info?.address, o.shipping_info?.addressDetail]
                        .filter(Boolean)
                        .join(" ") || "-",
                    ],
                    [
                      "주문일",
                      new Date(o.created_at).toLocaleDateString("ko-KR"),
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k as string}
                      className="flex justify-between border-t border-hairline-soft px-3 py-1.5 text-xs"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span className="max-w-[65%] truncate text-right font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              );
            })
          )}
        </TabsContent>

        {/* ══ 굿즈 ══ */}
        <TabsContent value="goods" className="mt-4 space-y-2.5">
          {data.products.map((p) => (
            <GoodsCard key={p.token} product={p} storeToken={storeToken} onChanged={reload} />
          ))}
          <Button asChild variant="outline" className="w-full">
            <Link href="/">
              <Plus className="h-4 w-4" /> 스튜디오에서 새 굿즈 만들기
            </Link>
          </Button>
        </TabsContent>

        {/* ══ 설정 ══ */}
        <TabsContent value="settings" className="mt-4">
          <SettingsPanel data={data} storeToken={storeToken} onChanged={reload} />
        </TabsContent>
      </Tabs>

      {/* ── 주문자 추가/수정 시트 ── */}
      <BuyerEditSheet
        storeToken={storeToken}
        products={openProducts}
        buyer={editBuyer}
        adding={addingBuyer}
        onClose={() => {
          setEditBuyer(null);
          setAddingBuyer(false);
        }}
        onSaved={() => {
          setEditBuyer(null);
          setAddingBuyer(false);
          reload();
        }}
      />

      {/* ── 전체 주문 넣기 시트 ── */}
      <ConvertAllSheet
        storeToken={storeToken}
        open={convertAllOpen}
        crewName={data.crewName}
        products={openProducts}
        onClose={() => setConvertAllOpen(false)}
        onDone={() => {
          setConvertAllOpen(false);
          reload();
        }}
      />
    </div>
  );
}

/* ────────────────────────── 굿즈 카드 ────────────────────────── */
function GoodsCard({
  product: p,
  storeToken,
  onChanged,
}: {
  product: ManageProduct;
  storeToken: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(p.title);
  const [price, setPrice] = useState(String(p.unitPrice ?? ""));
  const [deadline, setDeadline] = useState(p.deadline?.slice(0, 10) ?? "");
  const [busy, setBusy] = useState(false);

  const patch = async (body: object, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeToken}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "실패");
      toast.success(okMsg);
      setEditing(false);
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const ordered = p.status === "ordered";

  // 참여자 수 (제출 묶음 기준)
  const participantCount = new Set(
    p.responses.map((r) => r.submissionId ?? r.id),
  ).size;

  const handleDelete = () => {
    const message =
      participantCount > 0
        ? `주문한 사람이 ${participantCount}명 있습니다.\n정말 '${p.title}'을(를) 지우겠습니까?\n제출한 사이즈 내역도 함께 삭제됩니다.`
        : `'${p.title}'을(를) 삭제할까요?`;
    if (!confirm(message)) return;
    patch(
      {
        product: {
          token: p.token,
          action: "delete",
          force: participantCount > 0,
        },
      },
      "삭제했습니다.",
    );
  };

  return (
    <div className="rounded-xl border border-hairline-soft p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="가격(원)"
                  className="font-mono"
                />
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="h-8 flex-1"
                  disabled={busy}
                  onClick={() =>
                    patch(
                      {
                        product: {
                          token: p.token,
                          title,
                          unitPrice: price ? parseInt(price, 10) : undefined,
                          deadline: deadline || null,
                        },
                      },
                      "저장되었습니다.",
                    )
                  }
                >
                  저장
                </Button>
                <Button
                  variant="outline"
                  className="h-8 flex-1"
                  onClick={() => setEditing(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className={`truncate text-sm font-bold ${ordered ? "text-muted-foreground" : ""}`}>
                {p.title}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {p.unitPrice != null ? won(p.unitPrice) : "가격 미정"} ·{" "}
                {ordered
                  ? `주문됨 (${p.orderNumber})`
                  : p.status === "closed"
                    ? "마감됨"
                    : p.deadline
                      ? `마감 ${p.deadline.slice(5, 10).replace("-", ".")}`
                      : "상시"}
              </p>
            </>
          )}
        </div>
        {!editing && !ordered && (
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-hairline px-2.5 py-1 text-[11px] font-bold"
            >
              수정
            </button>
            {p.status === "open" ? (
              <button
                disabled={busy}
                onClick={() =>
                  patch({ product: { token: p.token, action: "close" } }, "마감했습니다.")
                }
                className="rounded-md border border-hairline px-2.5 py-1 text-[11px] font-bold"
              >
                마감
              </button>
            ) : (
              <>
                <button
                  disabled={busy}
                  onClick={() =>
                    patch({ product: { token: p.token, action: "reopen" } }, "재오픈했습니다.")
                  }
                  className="rounded-md border border-hairline px-2.5 py-1 text-[11px] font-bold"
                >
                  재오픈
                </button>
                <button
                  disabled={busy}
                  onClick={handleDelete}
                  className="rounded-md border border-danger px-2.5 py-1 text-[11px] font-bold text-danger"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────── 설정 패널 ────────────────────────── */
function SettingsPanel({
  data,
  storeToken,
  onChanged,
}: {
  data: ManageData;
  storeToken: string;
  onChanged: () => void;
}) {
  const [openFrom, setOpenFrom] = useState(data.openFrom ?? "");
  const [openUntil, setOpenUntil] = useState(data.openUntil ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeToken}/manage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store: { openFrom: openFrom || null, openUntil: openUntil || null },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "저장 실패");
      toast.success("저장되었습니다.");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/store/${storeToken}`);
    toast.success("상점 링크가 복사되었습니다.");
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs text-muted-foreground">상점 운영기간</Label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            type="date"
            value={openFrom}
            onChange={(e) => setOpenFrom(e.target.value)}
            className="font-mono"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="date"
            value={openUntil}
            onChange={(e) => setOpenUntil(e.target.value)}
            className="font-mono"
          />
        </div>
        <p className="mt-2 rounded-lg bg-soft-cloud p-3 text-xs leading-relaxed text-muted-foreground">
          운영기간이 지나면 상점은 &ldquo;운영 종료&rdquo;로 표시되고 새 주문을 받지
          않습니다. 비워두면 상시 운영입니다. 관리 페이지는 계속 사용할 수 있습니다.
        </p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">상점 링크</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            readOnly
            value={`/store/${storeToken}`}
            className="font-mono text-xs"
          />
          <Button variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4" /> 복사
          </Button>
        </div>
      </div>

      <Button className="w-full" disabled={busy} onClick={save}>
        저장
      </Button>
    </div>
  );
}

/* ────────────────────── 주문자 추가/수정 시트 ────────────────────── */
function BuyerEditSheet({
  storeToken,
  products,
  buyer,
  adding,
  onClose,
  onSaved,
}: {
  storeToken: string;
  products: ManageProduct[];
  buyer: BuyerGroup | null;
  adding: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = !!buyer || adding;
  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  // productToken → size → qty
  const [qty, setQty] = useState<Record<string, Record<string, number>>>({});
  const [busy, setBusy] = useState(false);
  const [initKey, setInitKey] = useState("");

  // 시트 열릴 때 초기화
  const currentKey = buyer ? buyer.key : adding ? "__add__" : "";
  if (open && currentKey !== initKey) {
    setInitKey(currentKey);
    setName(buyer?.name ?? "");
    setPhone4(buyer?.phoneLast4 ?? "");
    const next: Record<string, Record<string, number>> = {};
    buyer?.lines.forEach((l) => {
      if (!next[l.productToken]) next[l.productToken] = {};
      next[l.productToken][l.size] = l.quantity;
    });
    setQty(next);
  }

  // 굿즈별 사이즈 목록: 관리 데이터엔 sizes가 없으므로 응답에 등장한 사이즈 + 표준 세트
  const sizesFor = (p: ManageProduct) => {
    const seen = new Set<string>();
    p.responses.forEach((r) => seen.add(r.size));
    Object.keys(qty[p.token] ?? {}).forEach((s) => seen.add(s));
    const base = ["XS", "S", "M", "L", "XL", "XXL", "FREE"];
    const inBase = base.filter((s) => seen.size === 0 || base.includes(s));
    return [...new Set([...inBase, ...seen])];
  };

  const save = async () => {
    if (!name.trim() || !/^\d{4}$/.test(phone4)) {
      toast.error("이름과 휴대폰 뒷 4자리를 입력해주세요.");
      return;
    }
    const items = Object.entries(qty)
      .map(([token, sq]) => ({
        token,
        sizeQuantities: Object.fromEntries(
          Object.entries(sq).filter(([, q]) => q > 0),
        ),
      }))
      .filter((i) => Object.keys(i.sizeQuantities).length > 0);
    if (items.length === 0) {
      toast.error("수량을 선택해주세요.");
      return;
    }
    setBusy(true);
    try {
      const isEdit = !!buyer;
      const res = await fetch(`/api/store/${storeToken}/orders`, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phoneLast4: phone4,
          ...(isEdit ? { submissionId: buyer!.key } : {}),
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "저장 실패");
      toast.success(isEdit ? "수정되었습니다." : "추가되었습니다.");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[88dvh] max-w-lg overflow-y-auto rounded-t-2xl p-5"
      >
        <SheetHeader className="p-0 text-left">
          <SheetTitle>{buyer ? `주문자 수정 — ${buyer.name}` : "주문자 직접 추가"}</SheetTitle>
          <SheetDescription>수량을 0으로 두면 해당 항목이 빠집니다</SheetDescription>
        </SheetHeader>

        <div className="mt-3 grid grid-cols-[1fr_120px] gap-2.5">
          <div>
            <Label className="text-xs text-muted-foreground">이름</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">뒷 4자리</Label>
            <Input
              value={phone4}
              onChange={(e) => setPhone4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className="mt-1 font-mono"
            />
          </div>
        </div>

        {products.map((p) => (
          <div key={p.token} className="mt-4">
            <p className="mb-1 text-xs font-bold">{p.title}</p>
            <div className="divide-y divide-hairline-soft border-y border-hairline-soft">
              {sizesFor(p).map((size) => {
                const q = qty[p.token]?.[size] ?? 0;
                const set = (v: number) =>
                  setQty((prev) => ({
                    ...prev,
                    [p.token]: {
                      ...(prev[p.token] ?? {}),
                      [size]: Math.max(0, Math.min(20, v)),
                    },
                  }));
                return (
                  <div key={size} className="flex items-center justify-between py-2">
                    <span className="font-mono text-sm font-bold">{size}</span>
                    <div className="flex items-center rounded-md border border-hairline">
                      <button
                        type="button"
                        onClick={() => set(q - 1)}
                        className="h-8 w-8 text-lg leading-none active:bg-soft-cloud"
                        aria-label={`${size} 빼기`}
                      >
                        −
                      </button>
                      <span
                        className={`w-9 text-center font-mono text-sm font-bold ${q > 0 ? "" : "text-hairline"}`}
                      >
                        {q}
                      </span>
                      <button
                        type="button"
                        onClick={() => set(q + 1)}
                        className="h-8 w-8 text-lg leading-none active:bg-soft-cloud"
                        aria-label={`${size} 더하기`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <Button className="mt-4 h-11 w-full" disabled={busy} onClick={save}>
          {busy ? "저장 중..." : "저장"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

/* ────────────────────── 전체 주문 넣기 시트 ────────────────────── */
function ConvertAllSheet({
  storeToken,
  open,
  crewName,
  products,
  onClose,
  onDone,
}: {
  storeToken: string;
  open: boolean;
  crewName: string;
  products: ManageProduct[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [busy, setBusy] = useState(false);

  const totalCount = products.reduce(
    (s, p) => s + p.responses.reduce((x, r) => x + r.quantity, 0),
    0,
  );
  const totalAmount = products.reduce(
    (s, p) =>
      s + p.responses.reduce((x, r) => x + r.quantity * (p.unitPrice ?? 0), 0),
    0,
  );

  const submit = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast.error("받는 분·연락처·배송지를 입력해주세요.");
      return;
    }
    if (!confirm("확정 후에는 취합이 마감되고 수정할 수 없습니다. 진행할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/store/${storeToken}/convert-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          shippingInfo: {
            recipientName: customerName,
            phone: customerPhone,
            address,
            addressDetail,
            organizationName: crewName,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "전환 실패");
      toast.success(`주문이 접수되었습니다! (${json.order.orderNumber})`, {
        description: "진행 상태는 '주문 진행' 탭에서 확인하세요.",
        duration: 8000,
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "전환에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[88dvh] max-w-lg overflow-y-auto rounded-t-2xl p-5"
      >
        <SheetHeader className="p-0 text-left">
          <SheetTitle>전체 주문 넣기</SheetTitle>
          <SheetDescription>
            열린 굿즈 {products.length}종 · {totalCount}장 · {won(totalAmount)} —
            주문번호 1개로 접수되며 확정 후 취합이 마감됩니다
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div>
            <Label className="text-xs text-muted-foreground">받는 분</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="크루장 이름"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">연락처</Label>
            <Input
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              inputMode="tel"
              placeholder="010-0000-0000"
              className="mt-1 font-mono"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">배송지</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="기본 주소"
              className="mt-1"
            />
            <Input
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="상세 주소 (예: ○○빌딩 3층, 크루 모임 장소)"
              className="mt-2"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              보통 크루장 주소 또는 크루 모임 장소로 일괄 배송합니다.
            </p>
          </div>
        </div>

        <Button
          className="mt-4 h-12 w-full bg-[#C7FF00] text-base font-extrabold text-[#0B0C0A] hover:bg-[#b8ef00]"
          disabled={busy}
          onClick={submit}
        >
          {busy ? "접수 중..." : "주문 확정"}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
