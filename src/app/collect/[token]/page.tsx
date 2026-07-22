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
  editToken: string;
  name: string;
  colorId?: string;
  size?: string;
  quantity?: number;
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
  const [colorId, setColorId] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");

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
    if (!name.trim() || !size) {
      toast.error("이름과 사이즈를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      if (editing && mySubmission) {
        const res = await fetch(`/api/collections/${token}/responses`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responseId: mySubmission.responseId,
            editToken: mySubmission.editToken,
            name,
            colorId: colorId || undefined,
            size,
            quantity,
            note,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        const updated: MySubmission = {
          ...mySubmission,
          name,
          colorId,
          size,
          quantity,
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
            colorId: colorId || undefined,
            size,
            quantity,
            note: note || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error);
        const submission: MySubmission = {
          responseId: json.data.id,
          editToken: json.data.editToken,
          name,
          colorId,
          size,
          quantity,
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
      const res = await fetch(
        `/api/collections/${token}/responses?responseId=${mySubmission.responseId}&editToken=${mySubmission.editToken}`,
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
                    if (mySubmission.size) setSize(mySubmission.size);
                    setQuantity(mySubmission.quantity ?? 1);
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
                        if (!v.sizes.includes(size)) setSize("");
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
                  사이즈 <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {selectedVariant.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition",
                        size === s
                          ? "border-ink bg-ink text-canvas"
                          : "border-hairline hover:border-stone",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
              <Label htmlFor="quantity">수량</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  -
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                >
                  +
                </Button>
              </div>
            </div>

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
              disabled={submitting || !name.trim() || !size}
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
