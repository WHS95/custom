"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * SearchPill — 1차 내비/PLP에서 사용하는 검색 알약
 *
 * - default : soft-cloud 배경, mute placeholder, 24px radius
 * - focused : canvas 배경 + 2px ink 보더 + 12px soft-cloud 외부 halo
 */
interface SearchPillProps extends Omit<React.ComponentProps<"input">, "size"> {
  /** 입력 핸들러 */
  onValueChange?: (value: string) => void
  /** 컨테이너 sizing — md(40px) / lg(48px) */
  size?: "md" | "lg"
  /** placeholder 옆 아이콘 표시 여부 (기본 true) */
  showIcon?: boolean
}

export const SearchPill = React.forwardRef<HTMLInputElement, SearchPillProps>(
  (
    {
      className,
      onValueChange,
      onChange,
      size = "md",
      showIcon = true,
      placeholder = "검색",
      ...props
    },
    ref
  ) => {
    const heightClass = size === "lg" ? "h-12" : "h-10"

    return (
      <label
        className={cn(
          "group inline-flex w-full items-center gap-2 rounded-[24px] bg-soft-cloud px-4 transition-all",
          "focus-within:bg-canvas focus-within:ring-2 focus-within:ring-soft-cloud focus-within:ring-offset-0",
          "focus-within:shadow-[inset_0_0_0_2px_var(--ink)]",
          heightClass,
          className
        )}
      >
        {showIcon ? (
          <Search
            aria-hidden
            className='size-4 shrink-0 text-mute group-focus-within:text-ink'
          />
        ) : null}
        <input
          ref={ref}
          type='search'
          placeholder={placeholder}
          className={cn(
            "w-full bg-transparent text-base text-ink outline-none",
            "placeholder:text-mute",
            "appearance-none [&::-webkit-search-cancel-button]:appearance-none"
          )}
          onChange={(e) => {
            onValueChange?.(e.target.value)
            onChange?.(e)
          }}
          {...props}
        />
      </label>
    )
  }
)

SearchPill.displayName = "SearchPill"
