"use client"

import { forwardRef, useCallback } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string
  onChange: (value: string) => void
}

/**
 * 전화번호를 010-XXXX-XXXX 형식으로 포맷
 */
function formatPhoneNumber(value: string): string {
  // 숫자만 추출
  const digits = value.replace(/\D/g, "")

  // 최대 11자리로 제한 (010 + 8자리)
  const limited = digits.slice(0, 11)

  // 길이에 따라 포맷팅
  if (limited.length <= 3) {
    return limited
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`
  }
}

/**
 * 전화번호 입력 컴포넌트
 * 입력 시 자동으로 010-XXXX-XXXX 형식으로 포맷팅됨
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value)
        onChange(formatted)
      },
      [onChange]
    )

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        placeholder="010-0000-0000"
        className={cn(className)}
        {...props}
      />
    )
  }
)

PhoneInput.displayName = "PhoneInput"
