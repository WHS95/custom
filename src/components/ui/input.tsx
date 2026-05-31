import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * RunHouse Custom 디자인 시스템 — Input (underline 패턴)
 *
 * 박스형 보더 대신 1px 하단 underline만 사용.
 * 검색용 알약 input은 별도 SearchPill 컴포넌트를 사용.
 *
 * - default: 1px solid hairline 하단
 * - focus  : 2px solid ink 하단
 * - error  : aria-invalid="true" 시 2px solid danger 하단
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 bg-transparent px-0 py-3 text-base text-ink",
        "border-0 border-b border-hairline rounded-none",
        "placeholder:text-mute selection:bg-ink selection:text-canvas",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink",
        "outline-none transition-colors",
        "focus-visible:border-b-2 focus-visible:border-ink",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-b-2 aria-invalid:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Input }
