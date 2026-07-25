"use client";

/**
 * 크루원 사이즈 제출 페이지 (공유 링크)
 */

import { use, useCallback, useEffect, useState } from "react";
import { Shirt, CheckCircle2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";

interface Variant {
  id: string;
  label: string;
  hex: string;
  sizes: string[];
}

interface CollectionInfo {
  title: string;
  crewName?: string;
  status: "open" | "closed" | "ordered";
  deadline?: string;
  deadlinePassed: boolean;
  unitPrice?: number;
  depositInfo?: string;
  responseCount: number;
  totalQuantity: number;
  product: {
    id: string;
    name: string;
    images: { colorId: string; view: string; url: string }[];
    variants: Variant[];
  } | null;
  designLayers: DesignLayer[] | null;
  designColor: {
    id: string;
    label: string;
    hex: string;
    views: Record<string, string>;
  } | null;
}

interface MySubmission {
  responseId: string;
  /** 다건 제출 묶음 ID (v2) — 구버전 저장분에는 없음 */
  submissionId?: string;
  editToken: string;
  name: string;
  phoneLast4?: string;
  colorId?: string;
  /** 구버전(단건) 저장분 */
  size?: string;
  quantity?: number;
  /** v2: 사이즈별 수량 */
  sizeQuantities?: Record<string, number>;
  note?: string;
}

export default function CollectSubmitPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const storageKey = `collect-submission-${token}`;

  const [info, setInfo] = useState<CollectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mySubmission, setMySubmission] = useState<MySubmission | null>(null);
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  const [colorId, setColorId] = useState("");
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");

  const totalQty = Object.values(sizeQuantities).reduce((s, q) => s + q, 0);

  const loadInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/collections/${token}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotFound(true);
        return;
      }
      setInfo(json.data);
      const first = json.data.product?.variants?.[0];
      if (first) {
        setColorId((prev) => prev || first.id);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInfo();
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setMySubmission(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, [loadInfo, storageKey]);

  const variants = info?.product?.variants || [];
  const selectedVariant = variants.find((v) => v.id === colorId);
  const previewImage =
    info?.product?.images.find(
      (img) => img.colorId === colorId && img.view === "front",
    )?.url || info?.product?.images.find((img) => img.view === "front")?.url;

  // 확정 디자인 (크루 스토어 모드): 색상 고정 + 커스텀 미리보기
  const hasDesign =
    !!info?.designLayers && info.designLayers.length > 0 && !!info.designColor;
  const designViews: HatView[] = hasDesign
    ? ([...new Set(info!.designLayers!.map((l) => l.view))] as HatView[])
    : [];
  const [designView, setDesignView] = useState<HatView | null>(null);
  const activeDesignView = designView ?? designViews[0] ?? "front";

  const closed =
    !info || info.status !== "open" || info.deadlinePassed;

  const handleSubmit = async () => {
    if (!name.trim() || totalQty === 0) {
      toast.error("이름과 사이즈별 수량을 입력해주세요.");
      return;
    }
    if (phone4 && !/^\d{4}$/.test(phone4)) {
      toast.error("휴대폰 뒷 4자리는 숫자 4자리입니다.");
      return;
    }
    setSubmitting(true);
    try {
      if (editing && mySubmission?.submissionId) {
        // v2 다건 수정: submission 단위 교체
        const res = await fetch(`/api/collections/${token}/responses`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            submissionId: mySubmission.submissionId,
            editToken: mySubmission.editToken,
            name,
            phoneLast4: phone4 || undefined,
            colorId: colorId || undefined,
            sizeQuantities,
            note,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        const updated: MySubmission = {
          ...mySubmission,
          name,
          phoneLast4: phone4,
          colorId,
          sizeQuantities,
          note,
        };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setMySubmission(updated);
        setEditing(false);
        toast.success("수정되었습니다.");
      } else if (editing && mySubmission) {
        // 구버전(단건) 저장분 수정: 첫 사이즈만 반영
        const [firstSize, firstQty] = Object.entries(sizeQuantities).find(
          ([, q]) => q > 0,
        )!;
        const res = await fetch(`/api/collections/${token}/responses`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responseId: mySubmission.responseId,
            editToken: mySubmission.editToken,
            name,
            colorId: colorId || undefined,
            size: firstSize,
            quantity: firstQty,
            note,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        const updated: MySubmission = {
          ...mySubmission,
          name,
          colorId,
          size: firstSize,
          quantity: firstQty,
          note,
        };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        setMySubmission(updated);
        setEditing(false);
        toast.success("수정되었습니다.");
      } else {
        const res = await fetch(`/api/collections/${token}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            phoneLast4: phone4 || undefined,
            colorId: colorId || undefined,
            sizeQuantities,
            note: note || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        const submission: MySubmission = {
          responseId: json.data.id,
          submissionId: json.data.submissionId,
          editToken: json.data.editToken,
          name,
          phoneLast4: phone4,
          colorId,
          sizeQuantities,
          note,
        };
        localStorage.setItem(storageKey, JSON.stringify(submission));
        setMySubmission(submission);
      }
      loadInfo();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!mySubmission) return;
    if (!confirm("제출을 취소할까요?")) return;
    try {
      const idParam = mySubmission.submissionId
        ? `submissionId=${mySubmission.submissionId}`
        : `responseId=${mySubmission.responseId}`;
      const res = await fetch(
        `/api/collections/${token}/responses?${idParam}&editToken=${mySubmission.editToken}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      localStorage.removeItem(storageKey);
      setMySubmission(null);
      setEditing(false);
      toast.success("제출이 취소되었습니다.");
      loadInfo();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "취소에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (notFound || !info) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium">취합을 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          링크가 정확한지 다시 확인해주세요.
        </p>
      </div>
    );
  }

  // 제출 완료 화면
  if (mySubmission && !editing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <div>
              <p className="text-lg font-semibold">
                {mySubmission.name}님, 제출 완료!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                현재까지 {info.responseCount}명이 참여했어요.
              </p>
            </div>
            {info.depositInfo && (
              <div className="rounded-lg bg-soft-cloud p-4 text-left">
                <p className="text-sm font-medium mb-1">입금 안내</p>
                <p className="text-sm whitespace-pre-wrap">{info.depositInfo}</p>
                {info.unitPrice != null && (
                  <p className="mt-2 text-sm font-semibold">
                    1장당 {info.unitPrice.toLocaleString()}원
                  </p>
                )}
              </div>
            )}
            {!closed && (
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // 저장된 제출 내용으로 폼 프리필
                    setName(mySubmission.name);
                    if (mySubmission.colorId) setColorId(mySubmission.colorId);
                    setPhone4(mySubmission.phoneLast4 ?? "");
                    // v2(사이즈별) 우선, 구버전(단건)은 해당 사이즈 1개로 변환
                    setSizeQuantities(
                      mySubmission.sizeQuantities ??
                        (mySubmission.size
                          ? { [mySubmission.size]: mySubmission.quantity ?? 1 }
                          : {}),
                    );
                    setNote(mySubmission.note ?? "");
                    setEditing(true);
                  }}
                >
                  내 제출 수정
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  제출 취소
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 space-y-6">
      <div className="text-center">
        {info.crewName && (
          <p className="text-kicker text-sm text-muted-foreground">{info.crewName}</p>
        )}
        <h1 className="text-2xl font-bold">{info.title}</h1>
        <div className="mt-2 flex items-center justify-center gap-3 text-sm text-muted-foreground">
          {info.deadline && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {new Date(info.deadline).toLocaleDateString("ko-KR")} 마감
            </span>
          )}
          <span>{info.responseCount}명 참여 중</span>
        </div>
      </div>

      {closed ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="font-medium">
              {info.status === "ordered"
                ? "주문이 완료된 취합입니다."
                : "마감된 취합입니다."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              운영진에게 문의해주세요.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              {info.product?.name || "상품"}
              {info.unitPrice != null && (
                <span className="ml-auto text-base font-semibold">
                  {info.unitPrice.toLocaleString()}원
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasDesign && info.designColor ? (
              <div className="space-y-2">
                <div className="mx-auto w-56">
                  <HatDesignCanvas
                    hatColor={info.designColor.id}
                    currentView={activeDesignView}
                    layers={info.designLayers!}
                    editable={false}
                    showSafeZone={false}
                    showViewLabel={false}
                    productColors={[
                      {
                        id: info.designColor.id,
                        label: info.designColor.label,
                        hex: info.designColor.hex,
                        views: info.designColor.views as Record<HatView, string>,
                      },
                    ]}
                    className="aspect-square w-full rounded-lg border border-hairline"
                  />
                </div>
                {designViews.length > 1 && (
                  <div className="flex justify-center gap-2">
                    {designViews.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setDesignView(v)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition",
                          activeDesignView === v
                            ? "border-ink bg-ink text-canvas"
                            : "border-hairline",
                        )}
                      >
                        {v === "front" ? "앞면" : v === "back" ? "뒷면" : v}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  우리 크루의 확정 디자인 · {info.designColor.label}
                </p>
              </div>
            ) : (
              previewImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewImage}
                  alt={selectedVariant?.label || info.product?.name || ""}
                  className="mx-auto aspect-square w-48 rounded-lg object-cover"
                />
              )
            )}

            {!hasDesign && variants.length > 0 && (
              <div className="space-y-2">
                <Label>
                  색상 <span className="text-red-500">*</span>
                  {selectedVariant && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      {selectedVariant.label}
                    </span>
                  )}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      title={v.label}
                      onClick={() => {
                        setColorId(v.id);
                        // 색상 변경 시 해당 색상에 없는 사이즈 수량 제거
                        setSizeQuantities((prev) =>
                          Object.fromEntries(
                            Object.entries(prev).filter(([s]) =>
                              v.sizes.includes(s),
                            ),
                          ),
                        );
                      }}
                      className={cn(
                        "h-9 w-9 rounded-full border-2 transition",
                        colorId === v.id
                          ? "border-ink ring-2 ring-ink ring-offset-2"
                          : "border-hairline",
                      )}
                      style={{ backgroundColor: v.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {selectedVariant && (
              <div className="space-y-2">
                <Label>
                  사이즈별 수량 <span className="text-red-500">*</span>
                </Label>
                <div className="divide-y divide-hairline-soft border-y border-hairline-soft">
                  {selectedVariant.sizes.map((s) => {
                    const q = sizeQuantities[s] ?? 0;
                    const set = (v: number) =>
                      setSizeQuantities((prev) => ({
                        ...prev,
                        [s]: Math.max(0, Math.min(20, v)),
                      }));
                    return (
                      <div key={s} className="flex items-center justify-between py-2.5">
                        <span className="font-mono text-sm font-bold">{s}</span>
                        <div className="flex items-center rounded-md border border-hairline">
                          <button
                            type="button"
                            aria-label={`${s} 빼기`}
                            onClick={() => set(q - 1)}
                            className="h-9 w-9 text-lg leading-none active:bg-soft-cloud"
                          >
                            −
                          </button>
                          <span
                            className={cn(
                              "w-10 text-center font-mono text-sm font-bold",
                              q > 0 ? "text-ink" : "text-hairline",
                            )}
                          >
                            {q}
                          </span>
                          <button
                            type="button"
                            aria-label={`${s} 더하기`}
                            onClick={() => set(q + 1)}
                            className="h-9 w-9 text-lg leading-none active:bg-soft-cloud"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {totalQty > 0 && (
                  <p className="text-right font-mono text-sm font-bold">
                    합계 {totalQty}장
                    {info.unitPrice != null &&
                      ` · ${(totalQty * info.unitPrice).toLocaleString()}원`}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-[1fr_130px] gap-3">
              <div className="space-y-2">
                <Label htmlFor="name">
                  이름 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="크루에서 쓰는 이름/닉네임"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone4">휴대폰 뒷 4자리</Label>
                <Input
                  id="phone4"
                  inputMode="numeric"
                  placeholder="1234"
                  className="font-mono"
                  value={phone4}
                  onChange={(e) =>
                    setPhone4(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </div>
            </div>
            <p className="-mt-2 text-[11px] leading-relaxed text-muted-foreground">
              뒷 4자리를 입력해두면 다른 기기에서도 이름+뒷4자리로 제출을
              확인·수정할 수 있어요.
            </p>

            <div className="space-y-2">
              <Label htmlFor="note">요청사항</Label>
              <Textarea
                id="note"
                placeholder="예: 등번호 7, 이름 프린팅 JUNHYUK"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={submitting || !name.trim() || totalQty === 0}
              onClick={handleSubmit}
            >
              {submitting ? "제출 중..." : editing ? "수정 완료" : "사이즈 제출하기"}
            </Button>
            {editing && (
              <Button
                className="w-full"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                취소
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
