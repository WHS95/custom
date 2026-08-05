import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * RunHouse Custom 디자인 시스템 — Button
 *
 * variants (DESIGN.md):
 * - default       → button-primary       : ink 알약, 1차 CTA
 * - secondary     → button-secondary     : soft-cloud 알약, 보조 CTA
 * - outline       → button-outline-on-image : canvas 알약, 사진 위 CTA
 * - destructive   → button-destructive   : canvas + 1px danger 보더 + danger 텍스트 (솔리드 빨강 금지)
 * - ghost         → 내비 톤, transparent 배경
 * - link          → underline 인라인 링크
 *
 * size: lg(56px·캠페인 헤로용) / default(48px) / sm(40px) / icon(40x40 원형)
 *
 * pressed: scale(0.96) + opacity 0.85 (Nike의 scale(0.5)을 한국 사용자 기준 완화)
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium",
    "transition-[background-color,border-color,color,transform,opacity,box-shadow] duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-2 focus-visible:ring-ink/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "active:scale-[0.96] active:opacity-85",
    "aria-invalid:ring-2 aria-invalid:ring-danger/30",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-ink text-canvas hover:bg-ink/90",
        secondary: "bg-soft-cloud text-ink hover:bg-soft-cloud/80",
        outline: "bg-canvas text-ink hover:bg-soft-cloud",
        destructive:
          "bg-canvas text-danger border border-danger hover:bg-danger/5",
        ghost: "bg-transparent text-ink hover:bg-soft-cloud",
        link:
          "text-ink underline underline-offset-4 hover:no-underline rounded-none px-0 h-auto",
      },
      size: {
        // 모든 알약 사이즈는 rounded-[30px] (radius-lg) — DESIGN.md 통일 규칙
        default: "h-12 px-8 py-3 text-base rounded-[30px] has-[>svg]:px-6",
        lg: "h-14 px-10 py-4 text-lg rounded-[30px] has-[>svg]:px-8",
        sm: "h-10 px-6 py-2 text-sm rounded-[30px] has-[>svg]:px-4 gap-1.5",
        icon: "size-10 rounded-full",
        "icon-sm": "size-9 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
