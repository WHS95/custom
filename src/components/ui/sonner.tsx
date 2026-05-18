"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          // 시스템 ink 알약 토스트
          "--normal-bg": "var(--ink)",
          "--normal-text": "var(--canvas)",
          "--normal-border": "transparent",
          "--success-bg": "var(--ink)",
          "--success-text": "var(--canvas)",
          "--success-border": "var(--success)",
          "--error-bg": "var(--ink)",
          "--error-text": "var(--canvas)",
          "--error-border": "var(--danger)",
          "--info-bg": "var(--ink)",
          "--info-text": "var(--canvas)",
          "--info-border": "var(--info)",
          "--border-radius": "30px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
