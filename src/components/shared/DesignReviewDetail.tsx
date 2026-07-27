"use client";

/**
 * 디자인 상세 미리보기 + 적용된 로고 다운로드
 * 제작 리뷰(공장 /review, 크루 내 제작 문의)에서 공용으로 사용.
 * 스튜디오처럼 뷰(앞/뒤/…)를 전환해 확인하고, 각 뷰에 올라간 로고 파일을 내려받는다.
 */

import { useMemo, useRef, useState } from "react";
import { Download, ImageDown } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";
import { cn } from "@/lib/utils";

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

export function DesignReviewDetail({
  designLayers,
  designColor,
  size = "md",
}: {
  designLayers: DesignLayer[] | null;
  designColor: DesignColorInfo | null;
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
  // 시안 캡처용 offscreen 노드 refs (뷰별)
  const shotRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [capturing, setCapturing] = useState<string | null>(null);

  if (!designLayers || designLayers.length === 0 || !designColor) return null;
  const activeView = view ?? views[0] ?? "front";

  const downloadMockup = async (v: HatView) => {
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
      a.download = `시안-${VIEW_LABEL[v] ?? v}.png`;
      a.click();
    } catch (err) {
      console.error("시안 캡처 실패:", err);
      toast.error("시안 이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setCapturing(null);
    }
  };

  // 이미지(로고) 레이어를 뷰별로 그룹
  const logosByView = new Map<string, DesignLayer[]>();
  designLayers
    .filter((l) => l.type === "image" && l.content)
    .forEach((l) => {
      if (!logosByView.has(l.view)) logosByView.set(l.view, []);
      logosByView.get(l.view)!.push(l);
    });

  // 텍스트 레이어 (견적서식 사양)
  const textLayers = designLayers.filter(
    (l) => l.type === "text" && l.content,
  );

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

      {/* 시안 다운로드 (로고·텍스트 합성 이미지, 뷰별) */}
      <div className="mt-3">
        <p className="mb-1.5 text-xs font-bold text-muted-foreground">
          디자인 시안 다운로드
        </p>
        <div className="flex flex-wrap gap-2">
          {views.map((v) => (
            <button
              key={v}
              type="button"
              disabled={capturing !== null}
              onClick={() => downloadMockup(v)}
              className="flex items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-xs font-bold transition-colors hover:bg-soft-cloud disabled:opacity-50"
            >
              <ImageDown className="h-3.5 w-3.5" />
              {capturing === v
                ? "생성 중..."
                : `${VIEW_LABEL[v] ?? v} 시안`}
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

      {/* 텍스트 사양 (견적서식 — 위치·내용·폰트·크기·색상) */}
      {textLayers.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-bold text-muted-foreground">
            텍스트 사양
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">위치</th>
                  <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">내용</th>
                  <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">폰트</th>
                  <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">크기</th>
                  <th className="border-b border-hairline-soft px-2 py-1.5 font-medium">색상</th>
                </tr>
              </thead>
              <tbody>
                {textLayers.map((l) => (
                  <tr key={l.id}>
                    <td className="border-b border-hairline-soft px-2 py-1.5">
                      {VIEW_LABEL[l.view] ?? l.view}
                    </td>
                    <td className="border-b border-hairline-soft px-2 py-1.5 font-medium text-ink">
                      {l.content}
                    </td>
                    <td className="border-b border-hairline-soft px-2 py-1.5">
                      {l.fontFamily ?? "기본"}
                    </td>
                    <td className="border-b border-hairline-soft px-2 py-1.5 font-mono">
                      {l.fontSize ? `${l.fontSize}px` : "기본"}
                    </td>
                    <td className="border-b border-hairline-soft px-2 py-1.5">
                      <span className="inline-flex items-center gap-1">
                        {l.color && (
                          <span
                            className="inline-block h-3 w-3 rounded-sm border border-hairline"
                            style={{ backgroundColor: l.color }}
                          />
                        )}
                        <span className="font-mono">{l.color ?? "-"}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 적용된 로고 파일 다운로드 (뷰별) */}
      {logosByView.size > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs font-bold text-muted-foreground">
            적용된 로고 파일
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
      )}
    </div>
  );
}
