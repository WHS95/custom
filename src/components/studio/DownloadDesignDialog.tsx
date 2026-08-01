"use client";

/**
 * 디자인 PNG 다운로드 (무로그인) — 인스타 스토리 스티커용.
 * - 제품샷 PNG: 옷 목업 + 디자인 합성(배경 포함)
 * - 스티커(투명) PNG: 디자인 레이어만 투명 배경
 * html-to-image로 offscreen 640px 노드를 래스터화(pixelRatio 3).
 */
import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import { Shirt, Sticker, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";

const VIEW_LABEL: Record<string, string> = {
  front: "앞면",
  back: "뒷면",
  left: "왼쪽",
  right: "오른쪽",
  top: "위",
};

interface ColorInfo {
  id: string;
  label: string;
  hex: string;
  views: Record<string, string>;
}

export function DownloadDesignDialog({
  open,
  onOpenChange,
  designLayers,
  designColor,
  productName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  designLayers: DesignLayer[];
  designColor: ColorInfo | null;
  productName?: string;
}) {
  const views = useMemo(
    () =>
      designLayers.length > 0
        ? ([...new Set(designLayers.map((l) => l.view))] as HatView[])
        : [],
    [designLayers],
  );
  const [view, setView] = useState<HatView | null>(null);
  const mockupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const activeView = view ?? views[0] ?? "front";
  const canDownload = designLayers.length > 0 && !!designColor;

  const base = (productName || "크루-굿즈").replace(/\s+/g, "-");

  const download = async (kind: "mockup" | "sticker", v: HatView) => {
    const node =
      kind === "mockup" ? mockupRefs.current[v] : stickerRefs.current[v];
    if (!node) return;
    setBusy(`${kind}-${v}`);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        // 제품샷은 목업 배경, 스티커는 투명
        ...(kind === "mockup" ? { backgroundColor: "#f5f5f5" } : {}),
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${base}-${VIEW_LABEL[v] ?? v}-${kind === "mockup" ? "제품샷" : "스티커"}.png`;
      a.click();
    } catch (err) {
      console.error("PNG 생성 실패:", err);
      toast.error("이미지 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>PNG 다운로드</DialogTitle>
          <DialogDescription>
            인스타 스토리에 올릴 이미지를 저장하세요. 제품샷은 배경 포함, 스티커는
            투명 배경이에요.
          </DialogDescription>
        </DialogHeader>

        {!canDownload ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            먼저 디자인을 추가해 주세요.
          </p>
        ) : (
          <div className="space-y-4">
            {/* 미리보기 */}
            <div className="mx-auto w-56 overflow-hidden rounded-xl bg-soft-cloud">
              <HatDesignCanvas
                hatColor={designColor!.id}
                currentView={activeView}
                layers={designLayers}
                editable={false}
                showSafeZone={false}
                showViewLabel={false}
                productColors={[
                  {
                    id: designColor!.id,
                    label: designColor!.label,
                    hex: designColor!.hex,
                    views: designColor!.views as Record<HatView, string>,
                  },
                ]}
                className="h-full w-full"
              />
            </div>

            {/* 뷰 전환 */}
            {views.length > 1 && (
              <div className="flex justify-center gap-2">
                {views.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setView(v)}
                    className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                      activeView === v
                        ? "border-ink bg-ink text-canvas"
                        : "border-hairline text-muted-foreground"
                    }`}
                  >
                    {VIEW_LABEL[v] ?? v}
                  </button>
                ))}
              </div>
            )}

            {/* 다운로드 버튼 */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="gap-1.5"
                disabled={!!busy}
                onClick={() => download("mockup", activeView)}
              >
                {busy === `mockup-${activeView}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shirt className="h-4 w-4" />
                )}
                제품샷
              </Button>
              <Button
                className="gap-1.5"
                disabled={!!busy}
                onClick={() => download("sticker", activeView)}
              >
                {busy === `sticker-${activeView}` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sticker className="h-4 w-4" />
                )}
                스티커(투명)
              </Button>
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              무료 · 로그인 없이 저장돼요.
            </p>
          </div>
        )}

        {/* 캡처용 offscreen 노드 (제품샷 + 투명 스티커, 뷰별) */}
        {canDownload && (
          <div
            aria-hidden
            style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }}
          >
            {views.map((v) => (
              <div key={v} style={{ display: "flex", gap: 0 }}>
                <div
                  ref={(el) => {
                    mockupRefs.current[v] = el;
                  }}
                  style={{ width: 640, height: 640 }}
                >
                  <HatDesignCanvas
                    hatColor={designColor!.id}
                    currentView={v}
                    layers={designLayers}
                    editable={false}
                    showSafeZone={false}
                    showViewLabel={false}
                    productColors={[
                      {
                        id: designColor!.id,
                        label: designColor!.label,
                        hex: designColor!.hex,
                        views: designColor!.views as Record<HatView, string>,
                      },
                    ]}
                    className="h-full w-full"
                  />
                </div>
                <div
                  ref={(el) => {
                    stickerRefs.current[v] = el;
                  }}
                  style={{ width: 640, height: 640 }}
                >
                  <HatDesignCanvas
                    hatColor={designColor!.id}
                    currentView={v}
                    layers={designLayers}
                    editable={false}
                    showSafeZone={false}
                    showViewLabel={false}
                    hideProduct
                    productColors={[
                      {
                        id: designColor!.id,
                        label: designColor!.label,
                        hex: designColor!.hex,
                        views: designColor!.views as Record<HatView, string>,
                      },
                    ]}
                    className="h-full w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
