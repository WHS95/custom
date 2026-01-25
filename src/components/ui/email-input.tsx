"use client"

import { forwardRef, useState, useCallback, useRef, useEffect } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface EmailInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string
  onChange: (value: string) => void
}

// 이메일 도메인 목록 (한국에서 많이 사용되는 도메인)
const EMAIL_DOMAINS = [
  { domain: "naver.com", triggers: ["n", "na", "nav", "nave"] },
  { domain: "gmail.com", triggers: ["g", "gm", "gma", "gmai"] },
  { domain: "daum.net", triggers: ["d", "da", "dau"] },
  { domain: "kakao.com", triggers: ["k", "ka", "kak", "kaka"] },
  { domain: "hanmail.net", triggers: ["h", "ha", "han", "hanm"] },
  { domain: "nate.com", triggers: ["na", "nat", "nate"] },
]

/**
 * 이메일 입력 컴포넌트
 * @ 입력 후 도메인 자동완성 지원
 */
export const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        onChange(newValue)

        // @ 이후 도메인 매칭
        const atIndex = newValue.indexOf("@")
        if (atIndex > 0) {
          const afterAt = newValue.slice(atIndex + 1).toLowerCase()

          if (afterAt.length === 0) {
            // @ 직후: 모든 도메인 표시
            setSuggestions(EMAIL_DOMAINS.map((d) => d.domain))
            setShowSuggestions(true)
            setSelectedIndex(-1)
          } else {
            // @ 이후 문자가 있을 때: 필터링
            const filtered = EMAIL_DOMAINS.filter(
              (d) =>
                d.domain.toLowerCase().startsWith(afterAt) ||
                d.triggers.some((t) => t.startsWith(afterAt))
            ).map((d) => d.domain)

            setSuggestions(filtered)
            setShowSuggestions(filtered.length > 0)
            setSelectedIndex(-1)
          }
        } else {
          setShowSuggestions(false)
        }
      },
      [onChange]
    )

    const selectSuggestion = useCallback(
      (domain: string) => {
        const atIndex = value.indexOf("@")
        const newValue = value.slice(0, atIndex + 1) + domain
        onChange(newValue)
        setShowSuggestions(false)
      },
      [value, onChange]
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!showSuggestions) return

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault()
            setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
            break
          case "ArrowUp":
            e.preventDefault()
            setSelectedIndex((prev) => Math.max(prev - 1, -1))
            break
          case "Enter":
          case "Tab":
            if (selectedIndex >= 0) {
              e.preventDefault()
              selectSuggestion(suggestions[selectedIndex])
            }
            break
          case "Escape":
            setShowSuggestions(false)
            break
        }
      },
      [showSuggestions, selectedIndex, suggestions, selectSuggestion]
    )

    // 외부 클릭 시 닫기
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setShowSuggestions(false)
        }
      }
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
      <div ref={containerRef} className="relative">
        <Input
          ref={ref}
          type="email"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="email@example.com"
          className={cn(className)}
          autoComplete="off"
          {...props}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
            {suggestions.map((domain, index) => {
              const atIndex = value.indexOf("@")
              const beforeAt = atIndex > 0 ? value.slice(0, atIndex + 1) : ""

              return (
                <button
                  key={domain}
                  type="button"
                  className={cn(
                    "w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors",
                    index === selectedIndex && "bg-blue-50"
                  )}
                  onClick={() => selectSuggestion(domain)}
                >
                  <span className="text-gray-500">{beforeAt}</span>
                  <span className="font-medium text-gray-900">{domain}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }
)

EmailInput.displayName = "EmailInput"
