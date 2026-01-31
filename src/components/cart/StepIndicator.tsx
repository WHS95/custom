"use client"

import { AlertTriangle, User, Truck, Paperclip, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export type OrderStep = "adminConfirm" | "customerInfo" | "shippingInfo" | "attachment" | "confirmation"

interface StepIndicatorProps {
  currentStep: OrderStep
  hasAdminMessage: boolean
}

const STEPS = [
  { id: "adminConfirm" as const, label: "확인사항", icon: AlertTriangle },
  { id: "customerInfo" as const, label: "주문자", icon: User },
  { id: "shippingInfo" as const, label: "배송정보", icon: Truck },
  { id: "attachment" as const, label: "파일첨부", icon: Paperclip },
  { id: "confirmation" as const, label: "주문확인", icon: CheckCircle },
]

export function StepIndicator({ currentStep, hasAdminMessage }: StepIndicatorProps) {
  // 관리자 메시지가 없으면 첫 단계 제외
  const steps = hasAdminMessage ? STEPS : STEPS.slice(1)
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const Icon = step.icon

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-blue-600 text-white",
                  !isCompleted && !isCurrent && "bg-gray-200 text-gray-400"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs mt-1 font-medium",
                  isCurrent && "text-blue-600",
                  isCompleted && "text-green-600",
                  !isCompleted && !isCurrent && "text-gray-400"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-8 sm:w-12 h-0.5 mx-1",
                  index < currentIndex ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
