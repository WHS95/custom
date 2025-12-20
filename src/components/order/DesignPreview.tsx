"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface DesignLayer {
  id: string
  type: "image" | "text"
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  view: "front" | "back" | "left" | "right" | "top"
  color?: string
}

interface DesignPreviewProps {
  layers: DesignLayer[]
  hatColor: string
  size?: "sm" | "md" | "lg"
}

// 모자 색상별 이미지 경로
const HAT_IMAGES: Record<string, Record<string, string>> = {
  black: {
    front: "/assets/hats/black-front.png",
    back: "/assets/hats/black-back.png",
    left: "/assets/hats/black-left.png",
    right: "/assets/hats/black-right.png",
    top: "/assets/hats/black-top.png",
  },
  khaki: {
    front: "/assets/hats/khaki-front.png",
    back: "/assets/hats/khaki-back.png",
    left: "/assets/hats/khaki-left.png",
    right: "/assets/hats/khaki-right.png",
    top: "/assets/hats/khaki-top.png",
  },
  beige: {
    front: "/assets/hats/beige-front.png",
    back: "/assets/hats/beige-back.png",
    left: "/assets/hats/beige-left.png",
    right: "/assets/hats/beige-right.png",
    top: "/assets/hats/beige-top.png",
  },
  red: {
    front: "/assets/hats/red-front.png",
    back: "/assets/hats/red-back.png",
    left: "/assets/hats/red-left.png",
    right: "/assets/hats/red-right.png",
    top: "/assets/hats/red-top.png",
  },
}

const VIEW_LABELS: Record<string, string> = {
  front: "정면",
  back: "후면",
  left: "좌측",
  right: "우측",
  top: "상단",
}

const SIZE_CONFIG = {
  sm: { container: 120, base: 100 },
  md: { container: 200, base: 180 },
  lg: { container: 300, base: 280 },
}

export function DesignPreview({ layers, hatColor, size = "md" }: DesignPreviewProps) {
  // 해당 색상의 모자 이미지
  const hatImages = HAT_IMAGES[hatColor] || HAT_IMAGES.black

  // 뷰별로 레이어 그룹화
  const layersByView = layers.reduce((acc, layer) => {
    if (!acc[layer.view]) acc[layer.view] = []
    acc[layer.view].push(layer)
    return acc
  }, {} as Record<string, DesignLayer[]>)

  // 디자인이 있는 뷰 목록
  const viewsWithDesign = Object.keys(layersByView)

  // 디자인이 있는 첫 번째 뷰를 기본값으로 설정
  const defaultView = viewsWithDesign.length > 0 ? viewsWithDesign[0] : "front"
  const [activeView, setActiveView] = useState<string>(defaultView)

  const config = SIZE_CONFIG[size]

  if (layers.length === 0) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm"
        style={{ width: config.container, height: config.container }}
      >
        디자인 없음
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 뷰 탭 */}
      {viewsWithDesign.length > 1 && (
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="h-7">
            {viewsWithDesign.map((view) => (
              <TabsTrigger key={view} value={view} className="text-xs px-2 py-1">
                {VIEW_LABELS[view] || view}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* 미리보기 캔버스 */}
      <div
        className="relative bg-gray-50 rounded-lg overflow-hidden border"
        style={{ width: config.container, height: config.container }}
      >
        {/* 모자 이미지 */}
        <img
          src={hatImages[activeView] || hatImages.front}
          alt={`${hatColor} hat ${activeView}`}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* 디자인 레이어들 */}
        {(layersByView[activeView] || []).map((layer) => {
          // 정규화된 좌표를 픽셀로 변환
          const pixelX = (layer.x / 100) * config.base
          const pixelY = (layer.y / 100) * config.base
          const pixelWidth = (layer.width / 100) * config.base
          const pixelHeight = (layer.height / 100) * config.base

          // 오프셋 (중앙 정렬)
          const offset = (config.container - config.base) / 2

          return (
            <div
              key={layer.id}
              className="absolute"
              style={{
                left: offset + pixelX,
                top: offset + pixelY,
                width: pixelWidth,
                height: pixelHeight,
                transform: `rotate(${layer.rotation}deg) scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`,
              }}
            >
              {layer.type === "image" ? (
                <img
                  src={layer.content}
                  alt="Design"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-center"
                  style={{ color: layer.color || "#000" }}
                >
                  {layer.content}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 뷰 라벨 */}
      <p className="text-xs text-center text-gray-500">
        {VIEW_LABELS[activeView] || activeView}
        {viewsWithDesign.length === 1 && ` (${layers.length}개 레이어)`}
      </p>
    </div>
  )
}
