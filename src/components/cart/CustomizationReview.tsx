"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Layers, Eye } from "lucide-react"
import { CartItem, useCartItemsByColor } from "@/lib/store/cart-store"
import { cn } from "@/lib/utils"

interface ColorGroup {
  color: string
  colorLabel: string
  colorHex: string
  items: CartItem[]
  totalQuantity: number
}

// 색상 ID → Hex 매핑 (기본값)
const COLOR_HEX_MAP: Record<string, string> = {
  black: "#1a1a1a",
  white: "#ffffff",
  beige: "#d4c4a8",
  khaki: "#8b8969",
  red: "#c41e3a",
  navy: "#1a2847",
  gray: "#6b7280",
}

// 뷰 라벨 매핑
const VIEW_LABELS: Record<string, string> = {
  front: "앞면",
  back: "뒷면",
  left: "왼쪽",
  right: "오른쪽",
  top: "위쪽",
}

interface CustomizationReviewProps {
  colorHexMap?: Record<string, string>
}

export function CustomizationReview({ colorHexMap }: CustomizationReviewProps) {
  const itemsByColor = useCartItemsByColor()
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set())

  // 색상별 그룹 데이터 생성
  const colorGroups: ColorGroup[] = Object.entries(itemsByColor).map(([color, items]) => ({
    color,
    colorLabel: items[0]?.colorLabel || color,
    colorHex: colorHexMap?.[color] || COLOR_HEX_MAP[color] || "#888888",
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  }))

  if (colorGroups.length === 0) {
    return null
  }

  const toggleExpand = (color: string) => {
    setExpandedColors((prev) => {
      const next = new Set(prev)
      if (next.has(color)) {
        next.delete(color)
      } else {
        next.add(color)
      }
      return next
    })
  }

  // 사이즈별 수량 요약
  const getSizeSummary = (items: CartItem[]) => {
    const sizeMap: Record<string, number> = {}
    items.forEach((item) => {
      sizeMap[item.size] = (sizeMap[item.size] || 0) + item.quantity
    })
    return Object.entries(sizeMap)
      .map(([size, qty]) => `${size}: ${qty}개`)
      .join(", ")
  }

  // 뷰별 레이어 그룹화
  const getLayersByView = (items: CartItem[]) => {
    const viewMap: Record<string, number> = {}
    items.forEach((item) => {
      item.designLayers.forEach((layer) => {
        viewMap[layer.view] = (viewMap[layer.view] || 0) + 1
      })
    })
    return viewMap
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold">주문 내역 확인</h2>
        </div>
        <p className="text-sm text-gray-500">
          각 색상을 클릭하여 커스텀 상세를 확인하세요
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {colorGroups.map((group) => {
          const isExpanded = expandedColors.has(group.color)
          const layersByView = getLayersByView(group.items)
          const totalLayers = group.items.reduce(
            (sum, item) => sum + item.designLayers.length,
            0
          )

          return (
            <div
              key={group.color}
              className="border rounded-lg overflow-hidden transition-all duration-300"
            >
              {/* 접힌 상태 헤더 */}
              <button
                onClick={() => toggleExpand(group.color)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between",
                  "hover:bg-gray-50 transition-colors",
                  isExpanded && "bg-gray-50 border-b"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 shadow-sm"
                    style={{ backgroundColor: group.colorHex }}
                  />
                  <div className="text-left">
                    <span className="font-medium">{group.colorLabel}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {group.totalQuantity}개
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {totalLayers > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      <Layers className="w-3 h-3 inline mr-1" />
                      {totalLayers} 레이어
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* 펼친 상태 상세 */}
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isExpanded
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="p-4 space-y-4">
                    {group.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex gap-4",
                          idx > 0 && "pt-4 border-t"
                        )}
                      >
                        {/* 디자인 미리보기 */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                          {item.designLayers.length > 0 ? (
                            <div className="w-full h-full relative">
                              {item.designLayers
                                .filter((l) => l.view === "front")
                                .slice(0, 1)
                                .map((layer) => (
                                  <img
                                    key={layer.id}
                                    src={layer.content}
                                    alt="Design preview"
                                    className="w-full h-full object-contain"
                                  />
                                ))}
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Layers className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* 상세 정보 */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              사이즈: {item.size}
                            </span>
                            <span className="text-sm font-bold">
                              {item.quantity}개
                            </span>
                          </div>

                          {/* 레이어 정보 */}
                          {item.designLayers.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 font-medium">
                                디자인 레이어:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(
                                  item.designLayers.reduce(
                                    (acc, layer) => {
                                      acc[layer.view] = (acc[layer.view] || 0) + 1
                                      return acc
                                    },
                                    {} as Record<string, number>
                                  )
                                ).map(([view, count]) => (
                                  <span
                                    key={view}
                                    className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                                  >
                                    {VIEW_LABELS[view] || view}: {count}개
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 단가 */}
                          <div className="text-sm text-gray-500">
                            {item.unitPrice.toLocaleString()}원 × {item.quantity} ={" "}
                            <span className="font-medium text-gray-900">
                              {(item.unitPrice * item.quantity).toLocaleString()}원
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* 색상별 소계 */}
                    <div className="pt-3 border-t flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {group.colorLabel} 소계 ({getSizeSummary(group.items)})
                      </span>
                      <span className="font-bold">
                        {group.items
                          .reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
                          .toLocaleString()}
                        원
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
