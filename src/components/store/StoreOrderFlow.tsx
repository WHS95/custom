"use client";

/**
 * 크루 스토어 주문 흐름 (구매자)
 * - 상품 탭 → 사이즈별 수량 시트 → 담기
 * - 하단 카트바 → 체크아웃 시트 (이름 + 휴대폰 뒷 4자리, 1회 입력)
 * - 내 주문 확인: 이름+뒷4자리로 상점 전체 주문 조회·수정·취소
 *
 * 제출은 POST /api/store/[storeToken]/orders 로 일괄 처리되며,
 * 서버가 굿즈·사이즈별 응답 행을 공통 submission_id로 생성한다.
 */

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";
import { cn } from "@/lib/utils";

export interface OrderableProduct {
  token: string;
  title: string;
  unitPrice?: number;
  sizes: string[];
  /** 제품 상세 (시트 상단 표시) */
  productName?: string | null;
  productDescription?: string | null;
  productDetailImageUrl?: string | null;
  /** 커스텀 디자인 미리보기 */
  designLayers?: DesignLayer[] | null;
  designColor?: {
    id: string;
    label: string;
    hex: string;
    views: Record<string, string>;
  } | null;
}

// 상점 장바구니: collectionToken → (size → qty)
export type StoreCart = Record<string, Record<string, number>>;

interface MyOrderItem {
  responseId: string;
  collectionToken?: string;
  title: string;
  collectionStatus?: string;
  unitPrice: number;
  size: string;
  quantity: number;
}

interface MySubmission {
  submissionId: string;
  createdAt: string;
  note: string | null;
  items: MyOrderItem[];
  total: number;
  locked: boolean;
}

const won = (n: number) => n.toLocaleString("ko-KR") + "원";

/** 커스텀 디자인 미리보기 — 디자인이 있는 뷰(앞/뒤) 전환 */
function ProductDesignPreview({ product }: { product: OrderableProduct }) {
  const layers = product.designLayers;
  const color = product.designColor;
  const views = useMemo(
    () =>
      layers && layers.length > 0
        ? ([...new Set(layers.map((l) => l.view))] as HatView[])
        : [],
    [layers],
  );
  const [view, setView] = useState<HatView | null>(null);
  if (!layers || layers.length === 0 || !color) return null;
  const activeView = view ?? views[0] ?? "front";

  return (
    <div className="mt-3">
      <div className="mx-auto w-52">
        <HatDesignCanvas
          hatColor={color.id}
          currentView={activeView}
          layers={layers}
          editable={false}
          showSafeZone={false}
          showViewLabel={false}
          productColors={[
            {
              id: color.id,
              label: color.label,
              hex: color.hex,
              views: color.views as Record<HatView, string>,
            },
          ]}
          className="aspect-square w-full rounded-lg border border-hairline-soft"
        />
      </div>
      {views.length > 1 && (
        <div className="mt-2 flex justify-center gap-2">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-bold transition",
                activeView === v
                  ? "border-ink bg-ink text-canvas"
                  : "border-hairline text-muted-foreground",
              )}
            >
              {v === "front" ? "앞면" : v === "back" ? "뒷면" : v}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        우리 크루의 확정 디자인 · {color.label}
      </p>
    </div>
  );
}

/** 사이즈별 수량 스테퍼 목록 */
function SizeSteppers({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
}) {
  return (
    <div className="divide-y divide-hairline-soft border-y border-hairline-soft">
      {sizes.map((size) => {
        const q = value[size] ?? 0;
        const set = (v: number) =>
          onChange({ ...value, [size]: Math.max(0, Math.min(20, v)) });
        return (
          <div key={size} className="flex items-center justify-between py-2.5">
            <span className="font-mono text-sm font-bold">{size}</span>
            <div className="flex items-center rounded-md border border-hairline">
              <button
                type="button"
                aria-label={`${size} 빼기`}
                onClick={() => set(q - 1)}
                className="flex h-9 w-9 items-center justify-center text-ink active:bg-soft-cloud"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span
                className={`w-10 text-center font-mono text-sm font-bold ${q > 0 ? "text-ink" : "text-hairline"}`}
              >
                {q}
              </span>
              <button
                type="button"
                aria-label={`${size} 더하기`}
                onClick={() => set(q + 1)}
                className="flex h-9 w-9 items-center justify-center text-ink active:bg-soft-cloud"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StoreOrderFlow({
  storeToken,
  products,
  selected,
  onCloseProduct,
  cart,
  setCart,
  onOrderComplete,
  myOrdersOpen,
  setMyOrdersOpen,
}: {
  storeToken: string;
  products: OrderableProduct[];
  /** 사이즈 선택 시트를 열 상품 (null = 닫힘) */
  selected: OrderableProduct | null;
  onCloseProduct: () => void;
  cart: StoreCart;
  setCart: (c: StoreCart) => void;
  onOrderComplete: () => void;
  myOrdersOpen: boolean;
  setMyOrdersOpen: (v: boolean) => void;
}) {
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 내 주문 조회
  const [lkName, setLkName] = useState("");
  const [lkPhone4, setLkPhone4] = useState("");
  const [lkLoading, setLkLoading] = useState(false);
  const [submissions, setSubmissions] = useState<MySubmission[] | null>(null);

  const productByToken = useMemo(
    () => new Map(products.map((p) => [p.token, p])),
    [products],
  );

  // 시트가 열릴 때 기존 담긴 수량을 draft로
  const openDraftFor = selected ? (cart[selected.token] ?? {}) : {};
  const draftKey = selected?.token ?? "";
  const [lastKey, setLastKey] = useState("");
  if (draftKey && draftKey !== lastKey) {
    setLastKey(draftKey);
    setDraft(openDraftFor);
  }

  const draftCount = Object.values(draft).reduce((s, q) => s + q, 0);
  const draftAmount = selected
    ? draftCount * (selected.unitPrice ?? 0)
    : 0;

  const cartSummary = useMemo(() => {
    let kinds = 0;
    let count = 0;
    let amount = 0;
    Object.entries(cart).forEach(([token, sq]) => {
      const p = productByToken.get(token);
      const c = Object.values(sq).reduce((s, q) => s + q, 0);
      if (c > 0 && p) {
        kinds++;
        count += c;
        amount += c * (p.unitPrice ?? 0);
      }
    });
    return { kinds, count, amount };
  }, [cart, productByToken]);

  const addToCart = () => {
    if (!selected || draftCount === 0) return;
    const cleaned = Object.fromEntries(
      Object.entries(draft).filter(([, q]) => q > 0),
    );
    setCart({ ...cart, [selected.token]: cleaned });
    onCloseProduct();
    toast.success(`${selected.title} — ${draftCount}장 담김`);
  };

  const removeFromCart = (token: string) => {
    const next = { ...cart };
    delete next[token];
    setCart(next);
  };

  const submitOrder = async () => {
    if (!name.trim() || !/^\d{4}$/.test(phone4)) {
      toast.error("이름과 휴대폰 뒷 4자리를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const items = Object.entries(cart)
        .map(([token, sizeQuantities]) => ({ token, sizeQuantities }))
        .filter((i) => Object.values(i.sizeQuantities).some((q) => q > 0));
      const res = await fetch(`/api/store/${storeToken}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneLast4: phone4, note, items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "주문 실패");
      toast.success("주문이 접수되었습니다!", {
        description: "이름과 뒷 4자리로 언제든 확인·수정할 수 있어요.",
      });
      setCart({});
      setCheckoutOpen(false);
      setNote("");
      onOrderComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "주문에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const lookup = async () => {
    if (!lkName.trim() || !/^\d{4}$/.test(lkPhone4)) {
      toast.error("이름과 휴대폰 뒷 4자리를 입력해주세요.");
      return;
    }
    setLkLoading(true);
    try {
      const res = await fetch(
        `/api/store/${storeToken}/orders?name=${encodeURIComponent(lkName.trim())}&phoneLast4=${lkPhone4}`,
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "조회 실패");
      setSubmissions(json.data.submissions);
      if (json.data.submissions.length === 0) {
        toast.info("주문 내역이 없습니다.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "조회에 실패했습니다.");
    } finally {
      setLkLoading(false);
    }
  };

  const cancelSubmission = async (submissionId: string) => {
    if (!confirm("이 주문을 취소할까요?")) return;
    try {
      const res = await fetch(
        `/api/store/${storeToken}/orders?submissionId=${submissionId}&name=${encodeURIComponent(lkName.trim())}&phoneLast4=${lkPhone4}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "취소 실패");
      toast.success("주문이 취소되었습니다.");
      setSubmissions((prev) =>
        (prev || []).filter((s) => s.submissionId !== submissionId),
      );
      onOrderComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "취소에 실패했습니다.");
    }
  };

  /** 수정: 해당 제출 내용을 장바구니로 불러와 체크아웃에서 재제출 */
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null);
  const editSubmission = (s: MySubmission) => {
    const next: StoreCart = {};
    s.items.forEach((i) => {
      if (!i.collectionToken) return;
      if (!next[i.collectionToken]) next[i.collectionToken] = {};
      next[i.collectionToken][i.size] = i.quantity;
    });
    setCart(next);
    setName(lkName);
    setPhone4(lkPhone4);
    setNote(s.note ?? "");
    setEditingSubmissionId(s.submissionId);
    setMyOrdersOpen(false);
    setCheckoutOpen(true);
  };

  const submitEdit = async () => {
    if (!editingSubmissionId) return submitOrder();
    setSubmitting(true);
    try {
      const items = Object.entries(cart)
        .map(([token, sizeQuantities]) => ({ token, sizeQuantities }))
        .filter((i) => Object.values(i.sizeQuantities).some((q) => q > 0));
      const res = await fetch(`/api/store/${storeToken}/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phoneLast4: phone4,
          submissionId: editingSubmissionId,
          note,
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "수정 실패");
      toast.success("주문이 수정되었습니다.");
      setCart({});
      setCheckoutOpen(false);
      setEditingSubmissionId(null);
      setNote("");
      onOrderComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "수정에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── 하단 고정 카트바 ── */}
      {cartSummary.count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
          <button
            onClick={() => setCheckoutOpen(true)}
            className="mx-auto flex w-full max-w-lg items-center justify-between rounded-xl bg-[#C7FF00] px-5 py-3.5 text-[#0B0C0A] shadow-lg transition active:scale-[0.99]"
          >
            <span className="font-mono text-sm font-extrabold">
              {cartSummary.kinds}종 {cartSummary.count}장 · {won(cartSummary.amount)}
            </span>
            <span className="flex items-center gap-1.5 text-sm font-extrabold">
              <ShoppingBag className="h-4 w-4" /> 주문하기
            </span>
          </button>
        </div>
      )}

      {/* ── 상품 상세 + 사이즈 선택 시트 ── */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && onCloseProduct()}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-t-2xl p-5"
        >
          {selected && (
            <>
              <SheetHeader className="p-0 text-left">
                <SheetTitle>{selected.title}</SheetTitle>
                <SheetDescription className="font-mono">
                  {selected.unitPrice != null ? `${won(selected.unitPrice)} / 1장` : ""}
                </SheetDescription>
              </SheetHeader>

              {/* 커스텀 디자인 미리보기 (앞/뒤 전환) */}
              <ProductDesignPreview product={selected} />

              {/* 제품 상세 */}
              {(selected.productName || selected.productDescription) && (
                <div className="mt-3 rounded-lg bg-soft-cloud p-3">
                  {selected.productName && (
                    <p className="text-xs font-bold">{selected.productName}</p>
                  )}
                  {selected.productDescription && (
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {selected.productDescription}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4">
                <SizeSteppers sizes={selected.sizes} value={draft} onChange={setDraft} />
                <div className="flex items-baseline justify-between py-3.5">
                  <span className="text-xs text-muted-foreground">합계</span>
                  <span className="font-mono text-lg font-extrabold">
                    {draftCount}장 · {won(draftAmount)}
                  </span>
                </div>
                <Button
                  className="h-12 w-full text-base"
                  disabled={draftCount === 0}
                  onClick={addToCart}
                >
                  {draftCount === 0
                    ? "수량을 선택하세요"
                    : `담기 — ${draftCount}장 ${won(draftAmount)}`}
                </Button>
              </div>

              {/* 제품 상세 이미지 (하단) */}
              {selected.productDetailImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.productDetailImageUrl}
                  alt={`${selected.productName ?? selected.title} 상세`}
                  className="mt-4 w-full rounded-lg"
                />
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── 체크아웃 시트 ── */}
      <Sheet
        open={checkoutOpen}
        onOpenChange={(o) => {
          setCheckoutOpen(o);
          if (!o) setEditingSubmissionId(null);
        }}
      >
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[88dvh] max-w-lg overflow-y-auto rounded-t-2xl p-5"
        >
          <SheetHeader className="p-0 text-left">
            <SheetTitle>
              {editingSubmissionId ? "주문 수정" : "주문하기"}
            </SheetTitle>
            <SheetDescription>
              여러 굿즈를 한 번에 주문합니다
            </SheetDescription>
          </SheetHeader>

          <div className="mt-3 divide-y divide-hairline-soft border-y border-hairline-soft">
            {Object.entries(cart).map(([token, sq]) => {
              const p = productByToken.get(token);
              if (!p) return null;
              const c = Object.values(sq).reduce((s, q) => s + q, 0);
              if (c === 0) return null;
              const detail = Object.entries(sq)
                .filter(([, q]) => q > 0)
                .map(([s, q]) => `${s}×${q}`)
                .join(" · ");
              return (
                <div key={token} className="flex items-center justify-between py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-bold">{p.title}</span>{" "}
                    <span className="font-mono text-xs text-muted-foreground">{detail}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-mono font-bold">
                      {won(c * (p.unitPrice ?? 0))}
                    </span>
                    <button
                      aria-label={`${p.title} 빼기`}
                      onClick={() => removeFromCart(token)}
                      className="text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-baseline justify-between py-3">
            <span className="text-xs text-muted-foreground">총 합계</span>
            <span className="font-mono text-lg font-extrabold">
              {cartSummary.count}장 · {won(cartSummary.amount)}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_130px] gap-3">
            <div>
              <Label htmlFor="order-name" className="text-xs text-muted-foreground">
                이름
              </Label>
              <Input
                id="order-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="김철수"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="order-phone4" className="text-xs text-muted-foreground">
                휴대폰 뒷 4자리
              </Label>
              <Input
                id="order-phone4"
                value={phone4}
                onChange={(e) =>
                  setPhone4(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                placeholder="1234"
                className="mt-1 font-mono"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="order-note" className="text-xs text-muted-foreground">
                요청사항 (선택)
              </Label>
              <Textarea
                id="order-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            이름과 뒷 4자리는 나중에 주문을 확인·수정할 때 사용됩니다.
          </p>

          <Button
            className="mt-4 h-12 w-full bg-[#C7FF00] text-base font-extrabold text-[#0B0C0A] hover:bg-[#b8ef00]"
            disabled={submitting || cartSummary.count === 0}
            onClick={editingSubmissionId ? submitEdit : submitOrder}
          >
            {submitting
              ? "처리 중..."
              : editingSubmissionId
                ? "수정 확정"
                : "주문 확정"}
          </Button>
        </SheetContent>
      </Sheet>

      {/* ── 내 주문 확인 시트 ── */}
      <Sheet open={myOrdersOpen} onOpenChange={setMyOrdersOpen}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[88dvh] max-w-lg overflow-y-auto rounded-t-2xl p-5"
        >
          <SheetHeader className="p-0 text-left">
            <SheetTitle>내 주문 확인</SheetTitle>
            <SheetDescription>
              주문할 때 입력한 이름과 휴대폰 뒷 4자리를 입력하세요
            </SheetDescription>
          </SheetHeader>

          <div className="mt-3 grid grid-cols-[1fr_110px_auto] gap-2">
            <Input
              value={lkName}
              onChange={(e) => setLkName(e.target.value)}
              placeholder="이름"
              aria-label="이름"
            />
            <Input
              value={lkPhone4}
              onChange={(e) =>
                setLkPhone4(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              placeholder="뒷 4자리"
              aria-label="휴대폰 뒷 4자리"
              className="font-mono"
            />
            <Button onClick={lookup} disabled={lkLoading}>
              {lkLoading ? "..." : "조회"}
            </Button>
          </div>

          {submissions && submissions.length > 0 && (
            <div className="mt-4 space-y-3">
              {submissions.map((s) => (
                <div
                  key={s.submissionId}
                  className="overflow-hidden rounded-xl border border-hairline-soft"
                >
                  <div className="flex items-center justify-between bg-soft-cloud px-3 py-2 text-xs">
                    <b>
                      {new Date(s.createdAt).toLocaleDateString("ko-KR", {
                        month: "numeric",
                        day: "numeric",
                      })}{" "}
                      주문 · {s.items.reduce((n, i) => n + i.quantity, 0)}장
                    </b>
                    <span
                      className={
                        s.locked ? "font-bold text-ink" : "font-bold text-success"
                      }
                    >
                      {s.locked ? "주문 확정됨" : "접수됨"}
                    </span>
                  </div>
                  {s.items.map((i) => (
                    <div
                      key={i.responseId}
                      className="flex justify-between border-t border-hairline-soft px-3 py-2 text-sm"
                    >
                      <span>{i.title}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {i.size}×{i.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-hairline-soft px-3 py-2 text-sm">
                    <span className="text-muted-foreground">합계</span>
                    <span className="font-mono font-extrabold">{won(s.total)}</span>
                  </div>
                  {!s.locked && (
                    <div className="flex gap-2 border-t border-hairline-soft p-2.5">
                      <Button
                        variant="outline"
                        className="h-9 flex-1"
                        onClick={() => editSubmission(s)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="outline"
                        className="h-9 flex-1 border-danger text-danger hover:bg-danger/5"
                        onClick={() => cancelSubmission(s.submissionId)}
                      >
                        주문 취소
                      </Button>
                    </div>
                  )}
                </div>
              ))}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                굿즈가 주문 확정된 후에는 수정·취소가 불가합니다. 크루 운영진에게
                문의하세요.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
