"use client"

import React from "react"
import { Box } from "lucide-react"
import { HatView } from "@/lib/store/studio-context"
import { HatDesignCanvas, DesignLayer } from "@/components/shared/HatDesignCanvas"

// 하위 호환성을 위한 타입 내보내기
export type { DesignLayer }
export type Layer = DesignLayer

interface HatCanvasProps {
  hatColor: string
  currentView: HatView
  onViewChange: (view: HatView) => void
  layers: DesignLayer[]
  onRemoveLayer: (id: string) => void
  onUpdateLayer?: (id: string, updates: Partial<DesignLayer>) => void
  selectedLayerId?: string | null
  onSelectLayer?: (id: string | null) => void
}

const VIEWS: { id: HatView; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
  { id: "back", label: "Back" },
  { id: "top", label: "Top" },
]

/**
 * 스튜디오용 모자 캔버스
 *
 * 공통 HatDesignCanvas를 사용하여 일관된 좌표 시스템을 유지합니다.
 */
export function HatCanvas({
  hatColor,
  currentView,
  onViewChange,
  layers,
  onRemoveLayer,
  onUpdateLayer,
  selectedLayerId,
  onSelectLayer,
}: HatCanvasProps) {
  // 현재 뷰의 레이어
  const currentLayers = layers.filter((l) => l.view === currentView)

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
      {/* 좌측 레이어 패널 */}
      <div className="absolute top-4 left-4 w-48 bg-white rounded-lg shadow-sm border p-3 z-10 hidden lg:block">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">
          Layers ({currentView})
        </h3>
        <div className="space-y-2">
          {/* 기본 모자 레이어 */}
          <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-sm font-medium border border-blue-100">
            <Box className="w-4 h-4" />
            Base Hat ({hatColor})
          </div>

          {currentLayers.length === 0 && (
            <div className="text-xs text-center py-2 text-gray-400">
              No layers on this side
            </div>
          )}

          {currentLayers.map((layer) => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer?.(layer.id)}
              className={`flex items-center gap-2 p-2 rounded text-sm font-medium border cursor-pointer group
                ${selectedLayerId === layer.id ? "bg-blue-50 border-blue-300" : "bg-white hover:bg-gray-50"}`}
            >
              <div className="w-4 h-4 rounded overflow-hidden relative flex items-center justify-center bg-gray-100">
                {layer.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={layer.content}
                    alt="layer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold">T</span>
                )}
              </div>
              <span className="truncate max-w-[100px]">
                {layer.type === "text" ? layer.content : "Image Layer"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 뷰 스위처 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border p-1 flex gap-1 z-20">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentView === v.id
                ? "bg-black text-white"
                : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* 메인 캔버스 영역 */}
      <div className="w-full h-full max-w-[700px] max-h-[700px] p-8">
        <HatDesignCanvas
          hatColor={hatColor}
          currentView={currentView}
          layers={layers}
          editable={true}
          onLayerUpdate={onUpdateLayer}
          onLayerRemove={onRemoveLayer}
          onLayerSelect={onSelectLayer}
          selectedLayerId={selectedLayerId}
          showSafeZone={true}
          showViewLabel={true}
          className="w-full h-full rounded-xl shadow-xl"
        />
      </div>
    </div>
  )
}
