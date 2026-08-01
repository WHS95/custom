"use client";

/**
 * 디자인 PNG 다운로드 (무로그인) — 인스타 스토리 스티커용.
 * - 제품샷 PNG: 옷 목업 + 디자인 합성(배경 포함)
 * - 스티커(투명) PNG: 옷+디자인을 배경만 투명 처리해 컷아웃(아이폰 목업 따듯이)
 * html-to-image로 offscreen 640px 노드를 래스터화 후 외곽 flood-fill 컷아웃.
 */
import { useMemo, useRef, useState } from "react";
import { toPng, toCanvas } from "html-to-image";
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

/**
 * 외곽 배경 컷아웃 — 4모서리에서 flood-fill로 배경색(균일)에 가까운 연결 픽셀을 투명 처리.
 * 옷 안쪽의 비슷한 색(마블 그레이 등)은 외곽과 연결되지 않아 보존된다(아이폰 목업 따듯이).
 */
function cutoutBackground(canvas: HTMLCanvasElement, tol = 46) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  // 시드 배경색 = 4모서리 평균
  const cIdx = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + (w - 1)) * 4];
  let sr = 0, sg = 0, sb = 0;
  for (const c of cIdx) {
    sr += d[c];
    sg += d[c + 1];
    sb += d[c + 2];
  }
  sr /= 4; sg /= 4; sb /= 4;
  const tol2 = tol * tol;
  const visited = new Uint8Array(w * h);
  const stack: number[] = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)];
  while (stack.length) {
    const p = stack.pop()!;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    const dr = d[i] - sr, dg = d[i + 1] - sg, db = d[i + 2] - sb;
    if (dr * dr + dg * dg + db * db > tol2) continue; // 배경 아님 → 경계
    d[i + 3] = 0; // 투명
    const x = p % w;
    const y = (p / w) | 0;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  ctx.putImageData(img, 0, 0);
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
  const [busy, setBusy] = useState<string | null>(null);

  const activeView = view ?? views[0] ?? "front";
  const canDownload = designLayers.length > 0 && !!designColor;

  const base = (productName || "크루-굿즈").replace(/\s+/g, "-");

  const triggerDownload = (dataUrl: string, kind: "mockup" | "sticker", v: HatView) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${base}-${VIEW_LABEL[v] ?? v}-${kind === "mockup" ? "제품샷" : "스티커"}.png`;
    a.click();
  };

  const download = async (kind: "mockup" | "sticker", v: HatView) => {
    const node = mockupRefs.current[v];
    if (!node) return;
    setBusy(`${kind}-${v}`);
    try {
      if (kind === "mockup") {
        const dataUrl = await toPng(node, {
          pixelRatio: 3,
          cacheBust: true,
          backgroundColor: "#f5f5f5",
        });
        triggerDownload(dataUrl, kind, v);
      } else {
        // 스티커: 옷+디자인을 캔버스로 → 외곽 배경 flood-fill 컷아웃 → 투명 PNG
        const canvas = await toCanvas(node, { pixelRatio: 2, cacheBust: true });
        cutoutBackground(canvas);
        const dataUrl = canvas.toDataURL("image/png");
        triggerDownload(dataUrl, kind, v);
      }
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
              <div
                key={v}
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
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
