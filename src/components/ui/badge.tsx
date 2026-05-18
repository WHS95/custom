import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * RunHouse Custom 디자인 시스템 — Badge
 *
 * 기본: badge-promo (canvas + 1px hairline + ink 텍스트, 알약)
 * 상태 variant는 텍스트 색만 바꾸고 배경은 canvas 유지 (시스템에 솔리드 빨강 배경 금지).
 *
 * - default        : 신상/곧 출시/재생 소재 등 일반 promo
 * - status-pending : 대기 상태 (ink)
 * - status-info    : 진행 중/정보 (info)
 * - status-success : 완료/성공 (success)
 * - status-danger  : 취소/실패 (danger)
 * - sale-text      : 컨테이너 없는 인라인 빨강 텍스트 — 가격 행 전용
 * - solid-ink      : ink 알약 (강조용, 드물게 사용)
 *
 * shadcn 호환: secondary/destructive/outline variant는 기존 호출처 보존을 위해 유지.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap",
    "rounded-[30px] px-3 py-1 text-xs font-medium",
    "transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-canvas border border-hairline text-ink",
        "status-pending": "bg-canvas border border-hairline text-ink",
        "status-info": "bg-canvas border border-hairline text-info",
        "status-success": "bg-canvas border border-hairline text-success",
        "status-danger": "bg-canvas border border-hairline text-danger",
        "sale-text":
          "inline border-0 bg-transparent p-0 text-sale font-semibold",
        "solid-ink": "bg-ink text-canvas border-0",
        // shadcn 호환
        secondary: "bg-soft-cloud border-0 text-ink",
        destructive: "bg-canvas border border-danger text-danger",
        outline: "bg-transparent border border-hairline text-ink",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
