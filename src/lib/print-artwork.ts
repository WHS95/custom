/**
 * 실물 크기 인쇄 시안 렌더러 (클라이언트 전용, canvas 합성).
 *
 * 디자인 레이어만(옷 목업 제외) 인쇄 영역 크롭 기준으로 그려
 * 실물 가로×세로 × DPI 픽셀의 투명 PNG를 만든다.
 * → 파일의 픽셀 치수가 곧 물리 치수를 인코딩(공장이 바로 실물 크기로 작업).
 *
 * HatDesignCanvas의 렌더 규칙(이미지 object-contain, 텍스트 중앙정렬·bold,
 * fontSize=(fontSize/400)*캔버스px, 중심 회전, 반전)을 canvas 좌표계로 복제한다.
 */

import type { PrintArea } from "./print-spec";
import { printAreaPx, printHeightCm } from "./print-spec";

export interface ArtworkLayer {
  type: "image" | "text";
  content: string;
  x: number; // 캔버스 %
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  vertical?: boolean;
}

const DEFAULT_FONT = "'Noto Sans KR', sans-serif";
const MAX_SIDE_PX = 5000; // 메모리 보호 상한 (초과 시 DPI 자동 하향)
const REF_CANVAS = 400;

/** http(s)는 CORS 허용으로 로드(캔버스 오염 방지), data:는 그대로 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:/.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src.slice(0, 60)}`));
    img.src = src;
  });
}

/** 이미지 원본 픽셀 크기 — DPI 경고 계산용 */
export async function loadImageNaturalSize(
  src: string,
): Promise<{ width: number; height: number }> {
  const img = await loadImage(src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export interface PrintArtworkResult {
  dataUrl: string;
  width: number; // 출력 px
  height: number;
  dpi: number; // 실효 DPI(상한으로 하향될 수 있음)
}

/**
 * 인쇄 영역 크롭 기준 실물 크기 시안 렌더.
 * @param layers 해당 뷰의 모든 레이어(뷰 필터링은 호출측 책임)
 */
export async function renderPrintArtwork(
  layers: ArtworkLayer[],
  area: PrintArea,
  targetDpi = 300,
): Promise<PrintArtworkResult> {
  const full = printAreaPx(area, targetDpi);
  // 상한 초과 시 DPI 하향
  const longest = Math.max(full.width, full.height);
  let dpi = targetDpi;
  if (longest > MAX_SIDE_PX) dpi = Math.floor((targetDpi * MAX_SIDE_PX) / longest);

  const out = printAreaPx(area, dpi);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, out.width);
  canvas.height = Math.max(1, out.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 컨텍스트를 만들 수 없습니다.");

  // 전체 캔버스(정사각형) px 공간: zone 너비%가 곧 출력 폭
  const fullCanvasPx = out.width / (area.zoneWidth / 100);
  const cropX = (area.zoneX / 100) * fullCanvasPx;
  const cropY = (area.zoneY / 100) * fullCanvasPx;

  // 폰트 선로드(텍스트가 기본 폰트로 폴백되는 것 방지)
  const textLayers = layers.filter((l) => l.type === "text" && l.content);
  if (textLayers.length > 0 && document.fonts) {
    await Promise.all(
      textLayers.map((l) => {
        const fontPx = (l.fontSize ?? 24) / REF_CANVAS * fullCanvasPx;
        const family = l.fontFamily || DEFAULT_FONT;
        return document.fonts
          .load(`bold ${fontPx}px ${family}`, l.content)
          .catch(() => undefined);
      }),
    );
    await document.fonts.ready;
  }

  for (const layer of layers) {
    if (!layer.content) continue;
    const lw = (layer.width / 100) * fullCanvasPx;
    const lh = (layer.height / 100) * fullCanvasPx;
    const lx = (layer.x / 100) * fullCanvasPx - cropX;
    const ly = (layer.y / 100) * fullCanvasPx - cropY;
    const cx = lx + lw / 2;
    const cy = ly + lh / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.scale(layer.flipX ? -1 : 1, layer.flipY ? -1 : 1);

    if (layer.type === "image") {
      try {
        const img = await loadImage(layer.content);
        const scale = Math.min(lw / img.naturalWidth, lh / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      } catch {
        // 개별 이미지 실패는 건너뛴다(전체 시안은 계속 생성)
      }
    } else {
      const fontPx = (layer.fontSize ?? 24) / REF_CANVAS * fullCanvasPx;
      ctx.font = `bold ${fontPx}px ${layer.fontFamily || DEFAULT_FONT}`;
      ctx.fillStyle = layer.color || "#000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (layer.vertical) {
        // 세로쓰기: 글자를 위→아래로 쌓아 그림(공백 제외)
        const chars = [...layer.content.replace(/\s/g, "")];
        const step = fontPx * 1.05;
        const startY = -((chars.length - 1) * step) / 2;
        chars.forEach((ch, i) => ctx.fillText(ch, 0, startY + i * step));
      } else {
        ctx.fillText(layer.content, 0, 0);
      }
    }
    ctx.restore();
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
    dpi,
  };
}

export { printHeightCm };
