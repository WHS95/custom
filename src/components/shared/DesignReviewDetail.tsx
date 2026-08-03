"use client";

/**
 * 디자인 상세 + 공장 작업지시(실물 치수·실물크기 시안).
 * 제작 리뷰(공장 /review, 크루 내 제작 문의)에서 공용으로 사용.
 *
 * 공장이 시안만으로 바로 작업할 수 있도록:
 *  1) 실물크기 300DPI 투명 PNG(인쇄용 시안) — 파일 픽셀=실물 치수
 *  2) 작업 사양표 — 각 요소의 위치·크기(mm)·회전·폰트·색상, 로고 실효 DPI 경고
 * 인쇄 영역 실측(printAreas)이 없으면 참고용 미리보기 시안으로 우아하게 대체.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, ImageDown, Ruler, AlertTriangle } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";
import { cn } from "@/lib/utils";
import {
  type PrintArea,
  printHeightCm,
  layerPrintSpec,
  imageDpi,
  MIN_SAFE_DPI,
} from "@/lib/print-spec";
import {
  renderPrintArtwork,
  loadImageNaturalSize,
} from "@/lib/print-artwork";

export interface DesignColorInfo {
  id: string;
  label: string;
  hex: string;
  views: Record<string, string>;
}

const VIEW_LABEL: Record<string, string> = {
  front: "앞면",
  back: "뒷면",
  left: "왼쪽",
  right: "오른쪽",
  top: "상단",
};

/** 로고(이미지 레이어) 다운로드 URL — Supabase 공개 URL이면 ?download 강제 */
function downloadHref(content: string): string {
  if (content.startsWith("data:")) return content;
  if (content.startsWith("http")) {
    return content + (content.includes("?") ? "&" : "?") + "download=";
  }
  return content;
}

const mm = (v: number) => `${v.toFixed(1)}mm`;

export function DesignReviewDetail({
  designLayers,
  designColor,
  printAreas,
  size = "md",
}: {
  designLayers: DesignLayer[] | null;
  designColor: DesignColorInfo | null;
  printAreas?: Record<string, PrintArea>;
  size?: "sm" | "md";
}) {
  const views = useMemo(
    () =>
      designLayers && designLayers.length > 0
        ? ([...new Set(designLayers.map((l) => l.view))] as HatView[])
        : [],
    [designLayers],
  );
  const [view, setView] = useState<HatView | null>(null);
  // 미리보기(참고용) 시안 캡처 refs
  const shotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [capturing, setCapturing] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);
  // 이미지 원본 픽셀 크기 (실효 DPI 계산용) — layerId → naturalWidth
  const [imgNatW, setImgNatW] = useState<Record<string, number>>({});

  // 이미지 레이어 원본 해상도 로드
  useEffect(() => {
    if (!designLayers) return;
    let cancelled = false;
    const imgs = designLayers.filter((l) => l.type === "image" && l.content);
    Promise.all(
      imgs.map(async (l) => {
        try {
          const { width } = await loadImageNaturalSize(l.content);
          return [l.id, width] as const;
        } catch {
          return [l.id, 0] as const;
        }
      }),
    ).then((pairs) => {
      if (!cancelled) setImgNatW(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [designLayers]);

  if (!designLayers || designLayers.length === 0 || !designColor) return null;
  const activeView = view ?? views[0] ?? "front";

  // 참고용 미리보기 시안(옷+디자인 합성, 저해상도) — 인쇄영역 없을 때 대체용
  const downloadPreviewMockup = async (v: HatView) => {
    const node = shotRefs.current[v];
    if (!node) return;
    setCapturing(v);
    try {
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f5f5f5",
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `미리보기-${VIEW_LABEL[v] ?? v}.png`;
      a.click();
    } catch (err) {
      console.error("미리보기 캡처 실패:", err);
      toast.error("미리보기 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setCapturing(null);
    }
  };

  // 실물크기 300DPI 인쇄용 시안(디자인만, 투명, 인쇄영역 크롭)
  const downloadPrintArtwork = async (v: HatView) => {
    const area = printAreas?.[v];
    if (!area) return;
    setPrinting(v);
    try {
      const layers = designLayers.filter((l) => l.view === v);
      const result = await renderPrintArtwork(layers, area);
      const wCm = area.printWidthCm.toFixed(0);
      const hCm = printHeightCm(area).toFixed(0);
      const a = document.createElement("a");
      a.href = result.dataUrl;
      a.download = `인쇄시안-${VIEW_LABEL[v] ?? v}-${wCm}x${hCm}cm-${result.dpi}dpi.png`;
      a.click();
      if (result.dpi < 300) {
        toast.info(
          `시안이 커서 ${result.dpi}DPI로 생성했어요(실물크기 유지).`,
        );
      }
    } catch (err) {
      console.error("인쇄 시안 생성 실패:", err);
      toast.error("인쇄 시안 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPrinting(null);
    }
  };

  const hasAnyPrintArea =
    !!printAreas && views.some((v) => printAreas[v]);

  const canvasW = size === "sm" ? "w-52" : "w-64";

  return (
    <div>
      {/* 스튜디오식 미리보기 */}
      <div className={cn("mx-auto", canvasW)}>
        <HatDesignCanvas
          hatColor={designColor.id}
          currentView={activeView}
          layers={designLayers}
          editable={false}
          showSafeZone={false}
          showViewLabel={false}
          productColors={[
            {
              id: designColor.id,
              label: designColor.label,
              hex: designColor.hex,
              views: designColor.views as Record<HatView, string>,
            },
          ]}
          className="aspect-square w-full rounded-lg border border-hairline"
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
              {VIEW_LABEL[v] ?? v}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
        {designColor.label}
      </p>

      {/* 인쇄용 시안 (실물크기 300DPI, 투명) */}
      <div className="mt-4 rounded-lg border border-ink/15 bg-soft-cloud/60 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-ink">
          <Ruler className="h-3.5 w-3.5" /> 인쇄용 시안 · 실물크기 300DPI
        </p>
        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
          디자인만 담긴 투명 PNG예요. 파일 픽셀 크기가 곧 실물 인쇄 크기라
          바로 전사·실사 작업에 쓸 수 있어요.
        </p>
        <div className="flex flex-wrap gap-2">
          {views.map((v) => {
            const area = printAreas?.[v];
            if (!area) return null;
            return (
              <button
                key={v}
                type="button"
                disabled={printing !== null}
                onClick={() => downloadPrintArtwork(v)}
                className="flex items-center gap-1.5 rounded-lg border border-ink bg-ink px-3 py-1.5 text-xs font-bold text-canvas transition-colors hover:bg-ink/90 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                {printing === v
                  ? "생성 중..."
                  : `${VIEW_LABEL[v] ?? v} ${area.printWidthCm.toFixed(0)}×${printHeightCm(area).toFixed(0)}cm`}
              </button>
            );
          })}
        </div>
        {!hasAnyPrintArea && (
          <p className="mt-1 text-[11px] text-danger">
            아직 인쇄 영역 실측 치수가 설정되지 않았어요. 상품 관리자에서 인쇄
            영역 가로(cm)를 입력하면 실물크기 시안을 받을 수 있어요. 아래
            참고용 미리보기로 대체됩니다.
          </p>
        )}
      </div>

      {/* 작업 사양 (작업지시서) — 뷰별 요소 위치·크기(mm) */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
          작업 사양 (실물 치수)
        </p>
        <div className="space-y-3">
          {views.map((v) => {
            const area = printAreas?.[v];
            const layers = designLayers.filter((l) => l.view === v);
            if (layers.length === 0) return null;
            return (
              <div
                key={v}
                className="overflow-hidden rounded-lg border border-hairline-soft"
              >
                <div className="flex items-center justify-between bg-soft-cloud px-3 py-1.5">
                  <span className="text-xs font-bold text-ink">
                    {VIEW_LABEL[v] ?? v}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {area
                      ? `인쇄영역 ${area.printWidthCm.toFixed(0)}×${printHeightCm(area).toFixed(0)}cm`
                      : "치수 미설정"}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">종류</th>
                        <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">내용/폰트</th>
                        <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">크기</th>
                        <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">위치(좌·상)</th>
                        <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">회전/색상</th>
                      </tr>
                    </thead>
                    <tbody>
                      {layers.map((l) => {
                        const spec = area ? layerPrintSpec(l, area) : null;
                        const isImg = l.type === "image";
                        // 이미지 실효 DPI
                        let dpiWarn: number | null = null;
                        if (isImg && spec && imgNatW[l.id]) {
                          const d = imageDpi(imgNatW[l.id], spec.widthMm);
                          if (d > 0 && d < MIN_SAFE_DPI) dpiWarn = Math.round(d);
                        }
                        return (
                          <tr key={l.id} className="align-top">
                            <td className="border-b border-hairline-soft px-2 py-1.5 whitespace-nowrap">
                              {isImg ? "로고" : "텍스트"}
                            </td>
                            <td className="border-b border-hairline-soft px-2 py-1.5">
                              {isImg ? (
                                <span className="text-muted-foreground">
                                  이미지
                                  {dpiWarn != null && (
                                    <span className="ml-1 inline-flex items-center gap-0.5 font-medium text-danger">
                                      <AlertTriangle className="h-3 w-3" />
                                      {dpiWarn}DPI
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span>
                                  <span className="font-medium text-ink">{l.content}</span>
                                  <span className="ml-1 text-[11px] text-muted-foreground">
                                    {l.fontFamily ?? "기본"}
                                  </span>
                                </span>
                              )}
                            </td>
                            <td className="border-b border-hairline-soft px-2 py-1.5 font-mono whitespace-nowrap">
                              {spec ? (
                                <>
                                  {mm(spec.widthMm)}×{mm(spec.heightMm)}
                                  {!isImg && spec.fontSizeMm != null && (
                                    <span className="block text-[10px] text-muted-foreground">
                                      글자 {mm(spec.fontSizeMm)}
                                    </span>
                                  )}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="border-b border-hairline-soft px-2 py-1.5 font-mono whitespace-nowrap">
                              {spec ? `${mm(spec.xMm)}, ${mm(spec.yMm)}` : "-"}
                            </td>
                            <td className="border-b border-hairline-soft px-2 py-1.5 whitespace-nowrap">
                              <span className="font-mono">{l.rotation || 0}°</span>
                              {!isImg && l.color && (
                                <span className="ml-1 inline-flex items-center gap-1">
                                  <span
                                    className="inline-block h-3 w-3 rounded-sm border border-hairline"
                                    style={{ backgroundColor: l.color }}
                                  />
                                  <span className="font-mono text-[10px]">{l.color}</span>
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          위치는 인쇄 영역 좌측 상단 기준. 로고 실효 해상도 {MIN_SAFE_DPI}DPI
          미만은 인쇄 시 깨질 수 있어요(원본을 더 큰 파일로 교체 권장).
        </p>
      </div>

      {/* 참고용 미리보기 시안 (옷 합성, 저해상도) */}
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
          참고용 미리보기 (옷 합성)
        </p>
        <div className="flex flex-wrap gap-2">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              disabled={capturing !== null}
              onClick={() => downloadPreviewMockup(v)}
              className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-bold transition-colors hover:bg-soft-cloud disabled:opacity-50"
            >
              <ImageDown className="h-3.5 w-3.5" />
              {capturing === v ? "생성 중..." : `${VIEW_LABEL[v] ?? v}`}
            </button>
          ))}
        </div>
      </div>

      {/* 캡처용 offscreen 렌더 (화면 밖, 고정 크기) */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
        }}
      >
        {views.map((v) => (
          <div
            key={v}
            ref={(el) => {
              shotRefs.current[v] = el;
            }}
            style={{ width: 640, height: 640 }}
          >
            <HatDesignCanvas
              hatColor={designColor.id}
              currentView={v}
              layers={designLayers}
              editable={false}
              showSafeZone={false}
              showViewLabel={false}
              productColors={[
                {
                  id: designColor.id,
                  label: designColor.label,
                  hex: designColor.hex,
                  views: designColor.views as Record<HatView, string>,
                },
              ]}
              className="h-full w-full"
            />
          </div>
        ))}
      </div>

      {/* 적용된 로고 원본 파일 다운로드 (뷰별) */}
      {(() => {
        const logosByView = new Map<string, DesignLayer[]>();
        designLayers
          .filter((l) => l.type === "image" && l.content)
          .forEach((l) => {
            if (!logosByView.has(l.view)) logosByView.set(l.view, []);
            logosByView.get(l.view)!.push(l);
          });
        if (logosByView.size === 0) return null;
        return (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground">
              적용된 로고 원본 파일
            </p>
            {[...logosByView.entries()].map(([v, logos]) => (
              <div key={v} className="space-y-1.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  {VIEW_LABEL[v] ?? v}
                </p>
                <div className="flex flex-wrap gap-2">
                  {logos.map((logo, i) => (
                    <a
                      key={logo.id}
                      href={downloadHref(logo.content)}
                      download={`logo-${v}-${i + 1}.png`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 rounded-lg border border-hairline-soft p-2 pr-3 transition-colors hover:bg-soft-cloud"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logo.content}
                        alt={`${VIEW_LABEL[v] ?? v} 로고 ${i + 1}`}
                        className="h-10 w-10 rounded object-contain"
                        style={{ backgroundColor: "#f2f2f2" }}
                      />
                      <span className="flex items-center gap-1 text-xs font-medium">
                        <Download className="h-3.5 w-3.5" />
                        다운로드
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
