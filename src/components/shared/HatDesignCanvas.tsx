"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { Rnd } from "react-rnd"
import { X } from "lucide-react"
import { useStudioConfig, HatView, ProductColor, Zone } from "@/lib/store/studio-context"

/**
 * 통합 좌표 시스템
 *
 * 모든 좌표는 캔버스 영역 대비 0-100% 퍼센트로 저장됩니다.
 * 예: x=50, y=50 → 캔버스 중앙
 * 예: width=20, height=20 → 캔버스의 20% 크기
 *
 * 이 컴포넌트는 스튜디오, 주문 상세, 미리보기 등 모든 곳에서
 * 동일한 렌더링 결과를 보장합니다.
 */

export interface DesignLayer {
  id: string
  type: "image" | "text"
  content: string
  x: number       // 0-100% (캔버스 좌측 기준)
  y: number       // 0-100% (캔버스 상단 기준)
  width: number   // 0-100% (캔버스 너비 대비)
  height: number  // 0-100% (캔버스 높이 대비)
  rotation: number
  flipX: boolean
  flipY: boolean
  view: HatView
  color?: string
}

interface HatDesignCanvasProps {
  // 필수 props
  hatColor: string
  currentView: HatView
  layers: DesignLayer[]

  // 편집 모드 (false면 읽기 전용)
  editable?: boolean

  // 레이어 조작 콜백 (editable=true일 때만 필요)
  onLayerUpdate?: (layerId: string, updates: Partial<DesignLayer>) => void
  onLayerRemove?: (layerId: string) => void
  onLayerSelect?: (layerId: string | null) => void
  selectedLayerId?: string | null

  // 스타일링
  className?: string
  showSafeZone?: boolean
  showViewLabel?: boolean

  // 상품별 색상/이미지 (제공되면 기본 config 대신 사용)
  productColors?: ProductColor[]
  // 상품별 인쇄 영역 (제공되면 기본 safeZones 대신 사용, 비활성화된 뷰는 미포함)
  productSafeZones?: Partial<Record<HatView, Zone>>
}

/**
 * 통합 모자 디자인 캔버스
 *
 * 모든 화면에서 동일한 좌표 시스템과 렌더링 로직을 사용합니다.
 */
export function HatDesignCanvas({
  hatColor,
  currentView,
  layers,
  editable = false,
  onLayerUpdate,
  onLayerRemove,
  onLayerSelect,
  selectedLayerId,
  className = "",
  showSafeZone = true,
  showViewLabel = false,
  productColors,
  productSafeZones,
}: HatDesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState(400)

  const { config } = useStudioConfig()

  // 상품별 색상이 제공되면 사용, 아니면 기본 config 사용
  const colors = productColors || config.colors

  // 상품별 인쇄 영역이 제공되면 사용, 아니면 기본 safeZones 사용
  const safeZones = productSafeZones || config.safeZones

  // 현재 색상과 뷰에 맞는 모자 이미지
  const hatImage = colors.find(c => c.id === hatColor)?.views[currentView] || ""

  // 현재 뷰의 안전 영역
  const zone = safeZones[currentView]

  // 현재 뷰의 레이어만 필터링
  const viewLayers = layers.filter(l => l.view === currentView)

  // 캔버스 크기 감지
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect()
      // 정사각형 캔버스이므로 너비 = 높이
      setCanvasSize(Math.min(rect.width, rect.height))
    }

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(canvas)
    updateSize()

    return () => resizeObserver.disconnect()
  }, [])

  // 퍼센트 → 픽셀 변환
  const toPixel = useCallback(
    (percent: number) => (percent / 100) * canvasSize,
    [canvasSize]
  )

  // 픽셀 → 퍼센트 변환
  const toPercent = useCallback(
    (pixel: number) => (pixel / canvasSize) * 100,
    [canvasSize]
  )

  // 레이어 드래그 완료
  const handleDragStop = (layerId: string, x: number, y: number) => {
    if (!editable || !onLayerUpdate) return
    onLayerUpdate(layerId, {
      x: toPercent(x),
      y: toPercent(y),
    })
  }

  // 레이어 리사이즈 완료
  const handleResizeStop = (
    layerId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (!editable || !onLayerUpdate) return
    onLayerUpdate(layerId, {
      x: toPercent(x),
      y: toPercent(y),
      width: toPercent(width),
      height: toPercent(height),
    })
  }

  // 레이어 선택
  const handleLayerClick = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (editable && onLayerSelect) {
      onLayerSelect(layerId)
    }
  }

  // 캔버스 클릭 (레이어 선택 해제)
  const handleCanvasClick = () => {
    if (editable && onLayerSelect) {
      onLayerSelect(null)
    }
  }

  return (
    <div
      ref={canvasRef}
      className={`relative aspect-square bg-gray-50 overflow-hidden ${className}`}
      onClick={handleCanvasClick}
    >
      {/* 모자 이미지 - 캔버스 전체를 채움 */}
      {hatImage && (
        <img
          src={hatImage}
          alt={`${hatColor} hat ${currentView}`}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none
            ${currentView === 'right' && hatColor !== 'black' ? 'scale-x-[-1]' : ''}
          `}
          draggable={false}
        />
      )}

      {/* 안전 영역 표시 */}
      {showSafeZone && zone && (
        <div
          className="absolute border-2 border-dashed border-blue-400/50 bg-blue-400/5 pointer-events-none z-[5]"
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
        >
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1 rounded-bl">
            PRINT AREA
          </div>
        </div>
      )}

      {/* 뷰 라벨 */}
      {showViewLabel && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
          {currentView.toUpperCase()}
        </div>
      )}

      {/* 디자인 레이어들 */}
      {viewLayers.map((layer) => {
        const isSelected = selectedLayerId === layer.id
        const pixelX = toPixel(layer.x)
        const pixelY = toPixel(layer.y)
        const pixelWidth = toPixel(layer.width)
        const pixelHeight = toPixel(layer.height)

        const transformStyle = `rotate(${layer.rotation}deg) scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`

        // 읽기 전용 모드
        if (!editable) {
          return (
            <div
              key={layer.id}
              className="absolute pointer-events-none"
              style={{
                left: pixelX,
                top: pixelY,
                width: pixelWidth,
                height: pixelHeight,
              }}
            >
              <div className="w-full h-full" style={{ transform: transformStyle }}>
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
            </div>
          )
        }

        // 편집 가능 모드 - Rnd 사용
        return (
          <Rnd
            key={layer.id}
            position={{ x: pixelX, y: pixelY }}
            size={{ width: pixelWidth, height: pixelHeight }}
            bounds="parent"
            lockAspectRatio={layer.type === "image"}
            className={`z-10 ${isSelected ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-blue-300"}`}
            onDragStart={(e) => {
              e.stopPropagation()
              onLayerSelect?.(layer.id)
            }}
            onDragStop={(e, d) => handleDragStop(layer.id, d.x, d.y)}
            onResizeStop={(e, direction, ref, delta, position) => {
              handleResizeStop(
                layer.id,
                position.x,
                position.y,
                parseFloat(ref.style.width),
                parseFloat(ref.style.height)
              )
            }}
            onClick={(e: React.MouseEvent) => handleLayerClick(layer.id, e)}
          >
            <div className="relative w-full h-full group">
              <div className="w-full h-full" style={{ transform: transformStyle }}>
                {layer.type === "image" ? (
                  <img
                    src={layer.content}
                    alt="Design"
                    className="w-full h-full object-contain pointer-events-none"
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

              {/* 삭제 버튼 */}
              {isSelected && onLayerRemove && (
                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                  onClick={(e) => {
                    e.stopPropagation()
                    onLayerRemove(layer.id)
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </Rnd>
        )
      })}
    </div>
  )
}

/**
 * 새 레이어 생성 시 기본 좌표 (안전 영역 중앙)
 */
export function getDefaultLayerPosition(view: HatView, config: { safeZones: Partial<Record<HatView, { x: number; y: number; width: number; height: number }>> }) {
  const zone = config.safeZones[view] || { x: 30, y: 30, width: 40, height: 30 }

  const layerSize = 15 // 15% 크기
  const centerX = zone.x + zone.width / 2 - layerSize / 2
  const centerY = zone.y + zone.height / 2 - layerSize / 2

  return {
    x: centerX,
    y: centerY,
    width: layerSize,
    height: layerSize,
  }
}
