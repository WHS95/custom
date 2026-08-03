/**
 * 인쇄 사양 변환 — 정규화 캔버스 좌표(0~100%) → 실물 물리 치수(cm/mm).
 *
 * 스튜디오 좌표계: 모든 레이어는 정사각형 캔버스 대비 0~100%.
 * 인쇄 영역(zone)도 캔버스 대비 %. 관리자가 인쇄 영역의 실측 가로(cm)를 입력하면
 * 그 값이 물리 앵커가 되어 모든 레이어의 실물 치수를 계산할 수 있다.
 *
 * 핵심: 세로(cm)는 zone 종횡비로 파생 → cm/% 환산이 X·Y 등방(isotropic).
 *   cmPerPercent = printWidthCm / zoneWidth
 */

export interface PrintArea {
  zoneX: number; // 인쇄 영역 좌측 (캔버스 %)
  zoneY: number; // 인쇄 영역 상단 (캔버스 %)
  zoneWidth: number; // 인쇄 영역 너비 (캔버스 %)
  zoneHeight: number; // 인쇄 영역 높이 (캔버스 %)
  printWidthCm: number; // 인쇄 영역 실측 가로 폭 (cm)
}

/** 인쇄 영역 세로 실측(cm) — zone 종횡비로 파생 */
export function printHeightCm(area: PrintArea): number {
  if (area.zoneWidth <= 0) return 0;
  return (area.printWidthCm * area.zoneHeight) / area.zoneWidth;
}

/** 캔버스 % 1당 실물 cm (X·Y 공통) */
export function cmPerPercent(area: PrintArea): number {
  if (area.zoneWidth <= 0) return 0;
  return area.printWidthCm / area.zoneWidth;
}

export interface LayerPrintSpec {
  widthMm: number;
  heightMm: number;
  /** 인쇄 영역 좌측 상단 기준 위치(mm) — 레이어 박스 좌상단 */
  xMm: number;
  yMm: number;
  /** 텍스트 폰트 크기(mm) — 텍스트 레이어만 */
  fontSizeMm?: number;
}

interface LayerLike {
  type: "image" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
}

const REF_CANVAS = 400; // HatDesignCanvas 폰트 기준 캔버스 px

/**
 * 레이어의 실물 인쇄 사양(mm) — 인쇄 영역 원점 기준.
 */
export function layerPrintSpec(
  layer: LayerLike,
  area: PrintArea,
): LayerPrintSpec {
  const cmPct = cmPerPercent(area);
  const toMm = (percent: number) => percent * cmPct * 10;

  const spec: LayerPrintSpec = {
    widthMm: toMm(layer.width),
    heightMm: toMm(layer.height),
    xMm: toMm(layer.x - area.zoneX),
    yMm: toMm(layer.y - area.zoneY),
  };

  if (layer.type === "text") {
    // 화면 폰트 px = (fontSize/400) * 캔버스px. 캔버스 100% = 100*cmPct cm.
    // → fontSize px 를 cm 로 환산: fontSize/400 * (100*cmPct) cm
    const fontSize = layer.fontSize ?? 24;
    spec.fontSizeMm = (fontSize / REF_CANVAS) * 100 * cmPct * 10;
  }

  return spec;
}

/**
 * 실물 크기 인쇄 시안의 픽셀 치수 (지정 DPI).
 * 세로는 zone 종횡비로 파생.
 */
export function printAreaPx(
  area: PrintArea,
  dpi: number,
): { width: number; height: number } {
  const wIn = area.printWidthCm / 2.54;
  const hIn = printHeightCm(area) / 2.54;
  return {
    width: Math.round(wIn * dpi),
    height: Math.round(hIn * dpi),
  };
}

/**
 * 이미지(로고) 레이어의 실효 인쇄 해상도(DPI).
 * 원본 픽셀 폭 / 인쇄 폭(inch). 150 미만이면 깨짐 위험.
 */
export function imageDpi(naturalWidthPx: number, widthMm: number): number {
  const widthIn = widthMm / 10 / 2.54;
  if (widthIn <= 0) return 0;
  return naturalWidthPx / widthIn;
}

export const MIN_SAFE_DPI = 150;
