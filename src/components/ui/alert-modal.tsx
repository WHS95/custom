"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, Info, CheckCircle, MessageCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type AlertType = "error" | "warning" | "info" | "success"

interface AlertAction {
  label: string
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

interface AlertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type?: AlertType
  title: string
  description?: string
  actions?: AlertAction[]
  /** 카카오톡 문의 링크 - 설정하면 문의하기 버튼 자동 추가 */
  kakaoLink?: string
  /** 닫기 버튼 텍스트 */
  closeLabel?: string
}

const alertConfig: Record<AlertType, { icon: typeof AlertCircle; iconColor: string; bgColor: string }> = {
  error: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    bgColor: "bg-green-50",
  },
}

export function AlertModal({
  open,
  onOpenChange,
  type = "error",
  title,
  description,
  actions = [],
  kakaoLink,
  closeLabel = "닫기",
}: AlertModalProps) {
  const config = alertConfig[type]
  const Icon = config.icon

  // 카카오톡 문의 액션 추가
  const allActions: AlertAction[] = [
    ...(kakaoLink
      ? [
          {
            label: "카카오톡 문의",
            onClick: () => window.open(kakaoLink, "_blank"),
            variant: "outline" as const,
          },
        ]
      : []),
    ...actions,
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader className="items-center text-center">
          {/* 아이콘 */}
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-2", config.bgColor)}>
            <Icon className={cn("w-8 h-8", config.iconColor)} />
          </div>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-center text-base mt-2">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col mt-4">
          {/* 카카오톡 문의 버튼 (있을 경우) */}
          {kakaoLink && (
            <Button
              onClick={() => window.open(kakaoLink, "_blank")}
              className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              카카오톡 문의하기
            </Button>
          )}
          
          {/* 추가 액션 버튼들 */}
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || "outline"}
              onClick={action.onClick}
              className="w-full"
            >
              {action.label}
            </Button>
          ))}

          {/* 닫기 버튼 */}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {closeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 편의를 위한 커스텀 훅
export function useAlertModal() {
  const [state, setState] = React.useState<{
    open: boolean
    type: AlertType
    title: string
    description?: string
    kakaoLink?: string
    actions?: AlertAction[]
  }>({
    open: false,
    type: "error",
    title: "",
  })

  const showAlert = React.useCallback(
    (options: {
      type?: AlertType
      title: string
      description?: string
      kakaoLink?: string
      actions?: AlertAction[]
    }) => {
      setState({
        open: true,
        type: options.type || "error",
        title: options.title,
        description: options.description,
        kakaoLink: options.kakaoLink,
        actions: options.actions,
      })
    },
    []
  )

  const hideAlert = React.useCallback(() => {
    setState((prev) => ({ ...prev, open: false }))
  }, [])

  const AlertModalComponent = React.useCallback(
    () => (
      <AlertModal
        open={state.open}
        onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
        type={state.type}
        title={state.title}
        description={state.description}
        kakaoLink={state.kakaoLink}
        actions={state.actions}
      />
    ),
    [state]
  )

  return {
    showAlert,
    hideAlert,
    AlertModal: AlertModalComponent,
  }
}
