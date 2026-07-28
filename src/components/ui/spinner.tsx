import { cn } from "@/lib/utils";

/**
 * 통일 로딩 스피너.
 * 색은 `currentColor`를 따른다 — 밝은 배경(어두운 글자)에선 검정,
 * 어두운 배경/버튼(밝은 글자)에선 밝게, 라임 컨텍스트에선 라임으로 대비된다.
 * 크기는 className(h-4 w-4 등)으로 조절. 기본 h-5 w-5.
 */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="로딩 중"
      className={cn(
        "inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em]",
        className,
      )}
    />
  );
}
