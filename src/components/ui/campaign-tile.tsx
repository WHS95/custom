"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * CampaignTile — 시스템 시그니처 컴포넌트
 *
 * 풀블리드 사진 + uppercase Bebas Neue / Pretendard Black 디스플레이 헤드라인 +
 * 좌하단 button-outline-on-image 알약 1개.
 *
 * 사용처:
 * - 홈 캠페인 헤로 (aspect="hero" 16:9)
 * - 카테고리/크루 타일 (aspect="portrait" 4:5)
 * - 멤버 혜택 카드 (aspect="square" 1:1)
 *
 * 헤드라인 색상은 사진 톤에 따라 호출처에서 ink 또는 canvas 중 선택.
 */
export interface CampaignTileProps {
  /** 풀블리드 이미지 src (Next/Image) */
  imageSrc: string
  imageAlt: string
  /** 1차 헤드라인 (영문 권장 — Bebas Neue 렌더링) */
  headline: string
  /** 2차 보조 라인 (선택, 한글 권장 — Pretendard Black 렌더링) */
  subheadline?: string
  /** CTA 라벨 */
  ctaLabel?: string
  /** CTA href — onCtaClick과 함께 사용 시 onCtaClick 우선 */
  ctaHref?: string
  onCtaClick?: () => void
  /** 헤드라인·CTA 텍스트 색상 */
  tone?: "light" | "dark"
  /** 비율 */
  aspect?: "hero" | "portrait" | "square"
  /** 텍스트 위치 */
  align?: "bottom-left" | "top-left" | "center"
  /** 추가 className */
  className?: string
  /** priority load (LCP 이미지) */
  priority?: boolean
}

export function CampaignTile({
  imageSrc,
  imageAlt,
  headline,
  subheadline,
  ctaLabel,
  ctaHref,
  onCtaClick,
  tone = "light",
  aspect = "hero",
  align = "bottom-left",
  className,
  priority = false,
}: CampaignTileProps) {
  const aspectClass =
    aspect === "hero"
      ? "aspect-[16/9]"
      : aspect === "portrait"
        ? "aspect-[4/5]"
        : "aspect-square"

  const alignClass =
    align === "center"
      ? "items-center justify-center text-center"
      : align === "top-left"
        ? "items-start justify-start"
        : "items-end justify-start"

  const headlineColor = tone === "light" ? "text-canvas" : "text-ink"

  const cta = ctaLabel ? (
    <CampaignCta
      label={ctaLabel}
      href={ctaHref}
      onClick={onCtaClick}
    />
  ) : null

  return (
    <section
      className={cn(
        "relative w-full overflow-hidden rounded-none",
        aspectClass,
        className
      )}
    >
      <Image
        src={imageSrc}
        alt={imageAlt}
        fill
        priority={priority}
        sizes='(min-width: 1024px) 80vw, 100vw'
        className='object-cover'
      />
      <div
        className={cn(
          "absolute inset-0 flex flex-col gap-4 p-6 md:p-10 lg:p-14",
          alignClass
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-2 max-w-3xl",
            align === "center" ? "items-center" : "items-start"
          )}
        >
          <h2
            className={cn(
              "font-display uppercase leading-[0.9] tracking-tight",
              "text-[clamp(2.5rem,7vw,6rem)]",
              headlineColor
            )}
          >
            {headline}
          </h2>
          {subheadline ? (
            <p
              className={cn(
                "font-display-ko",
                "text-[clamp(1.25rem,2.5vw,2rem)]",
                headlineColor
              )}
            >
              {subheadline}
            </p>
          ) : null}
        </div>
        {cta}
      </div>
    </section>
  )
}

function CampaignCta({
  label,
  href,
  onClick,
}: {
  label: string
  href?: string
  onClick?: () => void
}) {
  const className = cn(
    "inline-flex h-12 items-center justify-center whitespace-nowrap px-8",
    "rounded-[30px] bg-canvas text-ink text-base font-medium",
    "transition-all hover:bg-soft-cloud",
    "active:scale-[0.96] active:opacity-85",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-canvas/60 focus-visible:ring-offset-2"
  )

  if (onClick) {
    return (
      <button type='button' className={className} onClick={onClick}>
        {label}
      </button>
    )
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    )
  }
  return null
}
