export interface PrintColor {
  label: string;
  hex: string;
}

// 텍스트 인쇄 허용 색상 팔레트 (강제 대상)
export const PRINT_COLOR_PALETTE: PrintColor[] = [
  { label: "반사 블랙", hex: "#2E2F38" },
  { label: "반사 다크그레이", hex: "#5C5A64" },
  { label: "반사 로얄블루", hex: "#434B91" },
  { label: "반사 옐로우", hex: "#FFBB55" },
  { label: "반사 그린", hex: "#277664" },
  { label: "반사 화이트", hex: "#EBF0F1" },
  { label: "반사 레드", hex: "#D03340" },
  { label: "반사 골드", hex: "#9C7F5A" },
  { label: "반사 블루", hex: "#4E7FAA" },
  { label: "반사 스카이블루", hex: "#A6D9F7" },
  { label: "반사 오렌지", hex: "#BC422D" },
  { label: "반사 바이올렛", hex: "#4F2463" },
  { label: "반사 브라운", hex: "#5C3C16" },
  { label: "반사 투명", hex: "#F6F7F1" },
  { label: "반사 네온레드", hex: "#FF4545" },
  { label: "반사 바나나", hex: "#FFA833" },
  { label: "반사 레드오렌지", hex: "#F13021" },
  { label: "반사 네온핑크", hex: "#FA4D68" },
  { label: "반사 네온옐로우", hex: "#F8F646" },
  { label: "반사 네온그린", hex: "#47F154" },
  { label: "반사 네온오렌지", hex: "#FF8440" },
  { label: "반사 스노우화이트2", hex: "#F5EEF2" },
  { label: "반사 그레이2", hex: "#BDBCC5" },
  { label: "반사 다크네이비2", hex: "#252A52" },
];

const normalizeHex = (value: string) => value.trim().toLowerCase();

function buildHexSet(palette: PrintColor[]): Set<string> {
  return new Set(palette.map((c) => normalizeHex(c.hex)));
}

export function isAllowedPrintColor(
  color: unknown,
  palette: PrintColor[] = PRINT_COLOR_PALETTE,
): boolean {
  if (typeof color !== "string" || !color.trim()) return false;
  return buildHexSet(palette).has(normalizeHex(color));
}

export function normalizePrintColor(
  color: unknown,
  fallbackHex: string = PRINT_COLOR_PALETTE[0].hex,
  palette: PrintColor[] = PRINT_COLOR_PALETTE,
): string {
  if (typeof color === "string" && isAllowedPrintColor(color, palette)) {
    return color;
  }

  return fallbackHex;
}
