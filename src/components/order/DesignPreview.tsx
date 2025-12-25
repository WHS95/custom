"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HatDesignCanvas, DesignLayer } from "@/components/shared/HatDesignCanvas"
import { HatView } from "@/lib/store/studio-context"

interface DesignPreviewProps {
  layers: DesignLayer[]
  hatColor: string
  size?: "sm" | "md" | "lg"
}

const VIEW_LABELS: Record<string, string> = {
  front: "정면",
  back: "후면",
  left: "좌측",
  right: "우측",
  top: "상단",
}

const SIZE_CONFIG = {
  sm: 120,
  md: 200,
  lg: 300,
}

/**
 * 디자인 미리보기 컴포넌트
 *
 * 공통 HatDesignCanvas를 사용하여 일관된 렌더링을 보장합니다.
 */
export function DesignPreview({ layers, hatColor, size = "md" }: DesignPreviewProps) {
  // 뷰별로 레이어 그룹화
  const layersByView = layers.reduce((acc, layer) => {
    if (!acc[layer.view]) acc[layer.view] = []
    acc[layer.view].push(layer)
    return acc
  }, {} as Record<string, DesignLayer[]>)

  // 디자인이 있는 뷰 목록
  const viewsWithDesign = Object.keys(layersByView) as HatView[]

  // 디자인이 있는 첫 번째 뷰를 기본값으로 설정
  const defaultView = viewsWithDesign.length > 0 ? viewsWithDesign[0] : "front"
  const [activeView, setActiveView] = useState<HatView>(defaultView as HatView)

  const containerSize = SIZE_CONFIG[size]

  if (layers.length === 0) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm"
        style={{ width: containerSize, height: containerSize }}
      >
        디자인 없음
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 뷰 탭 */}
      {viewsWithDesign.length > 1 && (
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as HatView)}>
          <TabsList className="h-7">
            {viewsWithDesign.map((view) => (
              <TabsTrigger key={view} value={view} className="text-xs px-2 py-1">
                {VIEW_LABELS[view] || view}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* 미리보기 캔버스 - 공통 컴포넌트 사용 */}
      <div style={{ width: containerSize, height: containerSize }}>
        <HatDesignCanvas
          hatColor={hatColor}
          currentView={activeView}
          layers={layers}
          editable={false}
          showSafeZone={false}
          showViewLabel={false}
          className="w-full h-full rounded-lg border"
        />
      </div>

      {/* 뷰 라벨 */}
      <p className="text-xs text-center text-gray-500">
        {VIEW_LABELS[activeView] || activeView}
        {viewsWithDesign.length === 1 && ` (${layers.length}개 레이어)`}
      </p>
    </div>
  )
}
