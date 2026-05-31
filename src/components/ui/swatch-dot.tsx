"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * SwatchDot — 상품 카드/Studio 컬러 선택용 원형 swatch
 *
 * size:
 *   - sm (12px): 상품 카드 colorway 표시
 *   - md (24px): Studio 색상 선택
 *
 * active 상태는 fill 변화 없이 동심원 시그니처 (2px ink 외곽 링 + 2px white 인터리어 갭)로 표현.
 * 흰/밝은 색상은 default에서도 1px hairline 외곽 링 추가.
 *
 * crew 색상 swatch는 hex 대신 var(--crew-primary)를 color로 넘기는 것을 권장.
 */
interface SwatchDotProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** swatch fill 색상 (hex 또는 CSS color string). 예: "#ed1aa0" 또는 "var(--crew-primary)" */
  color: string
  /** 선택 상태 */
  active?: boolean
  /** 크기 */
  size?: "sm" | "md"
  /** 접근성 레이블 (예: "빨강", "Crew Color") */
  label?: string
}

export const SwatchDot = React.forwardRef<HTMLButtonElement, SwatchDotProps>(
  ({ className, color, active = false, size = "sm", label, ...props }, ref) => {
    const isLight = isLightColor(color)
    const ringSize =
      size === "sm" ? "size-3" : "size-6" // 12px / 24px
    const outerSize =
      size === "sm" ? "size-5" : "size-9" // active 동심원 외곽

    if (active) {
      // 동심원: 외곽 ring(ink) → 내부 캔버스 갭 → 컬러 dot
      const outerPx = size === "sm" ? "size-5" : "size-9"
      const innerPx = size === "sm" ? "size-3" : "size-6"
      return (
        <button
          ref={ref}
          type='button'
          aria-label={label}
          aria-pressed='true'
          className={cn(
            "inline-flex items-center justify-center rounded-full",
            "border-2 border-ink bg-canvas p-[2px]",
            outerPx,
            "transition-transform active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            className
          )}
          {...props}
        >
          <span
            className={cn("rounded-full", innerPx)}
            style={{ backgroundColor: color }}
          />
        </button>
      )
    }

    return (
      <button
        ref={ref}
        type='button'
        aria-label={label}
        aria-pressed='false'
        className={cn(
          "inline-block rounded-full transition-transform active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
          ringSize,
          isLight && "ring-1 ring-hairline ring-inset",
          className
        )}
        style={{ backgroundColor: color }}
        {...props}
      />
    )
  }
)

SwatchDot.displayName = "SwatchDot"

/**
 * 흰/밝은 컬러 판별 — 1px hairline 외곽 링이 필요한지 결정.
 * CSS 변수(var(--...))는 런타임에 평가 불가하므로 default false 처리하고
 * 호출처에서 필요 시 className으로 ring을 명시.
 */
function isLightColor(color: string): boolean {
  if (!color.startsWith("#")) return false
  const hex = color.replace("#", "")
  if (hex.length !== 6) return false
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  // ITU-R BT.601 luminance
  const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255
  return luminance > 0.85
}
