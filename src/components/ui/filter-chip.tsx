"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * FilterChip — PLP/Studio 양쪽에서 재사용되는 알약 토글
 *
 * default : canvas + 1px hairline + ink 텍스트
 * active  : ink 배경 + canvas 텍스트 (완전 인버스, 중간 상태 없음)
 *
 * 사용처:
 * - PLP 필터: 카테고리/색상/사이즈/가격대 다중 선택
 * - Studio 도구 탭: 텍스트/로고/색상/위치 단일 선택
 * - 정렬·뷰 토글
 */
interface FilterChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  active?: boolean
  /** 라벨 옆 카운트 (예: "흰색 (12)") — mute 색으로 렌더 */
  count?: number
}

export const FilterChip = React.forwardRef<HTMLButtonElement, FilterChipProps>(
  ({ className, active = false, count, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type='button'
        data-active={active ? "true" : "false"}
        className={cn(
          "inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap",
          "rounded-[30px] px-4 text-sm font-medium transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          "active:scale-[0.96] active:opacity-85",
          active
            ? "bg-ink text-canvas border border-ink"
            : "bg-canvas text-ink border border-hairline hover:bg-soft-cloud",
          className
        )}
        {...props}
      >
        <span>{children}</span>
        {typeof count === "number" ? (
          <span
            className={cn(
              "text-xs font-normal",
              active ? "text-canvas/70" : "text-mute"
            )}
          >
            ({count})
          </span>
        ) : null}
      </button>
    )
  }
)

FilterChip.displayName = "FilterChip"
