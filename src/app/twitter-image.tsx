// runtime은 route segment config라 재export 불가(Turbopack 정적 파싱) → 직접 선언
export const runtime = "edge";
export { alt, contentType, size } from "./opengraph-image";
export { default } from "./opengraph-image";
