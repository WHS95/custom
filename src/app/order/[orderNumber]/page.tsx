"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Save,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Upload,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Lock,
  Unlock,
  Image as ImageIcon,
  MessageSquare,
  Download,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { useStudioConfig, HatView } from "@/lib/store/studio-context"
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/domain/order"
import {
  HatDesignCanvas,
  DesignLayer,
  getDefaultLayerPosition,
} from "@/components/shared/HatDesignCanvas"

interface OrderItem {
  id: string
  productName: string
  color: string
  colorLabel: string
  size: string
  quantity: number
  unitPrice: number
  totalPrice: number
  designSnapshot: DesignLayer[]
}

interface OrderDetail {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  shippingInfo: {
    recipientName: string
    phone: string
    address: string
    addressDetail?: string
    organizationName?: string
  }
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  totalAmount: number
  status: OrderStatus
  createdAt: string
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  design_confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  in_production: "bg-orange-100 text-orange-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700",
}

const VIEWS: { id: HatView; label: string }[] = [
  { id: "front", label: "정면" },
  { id: "back", label: "후면" },
  { id: "left", label: "좌측" },
  { id: "right", label: "우측" },
  { id: "top", label: "상단" },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderNumber = params.orderNumber as string

  const { config } = useStudioConfig()

  // 주문 데이터
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 현재 선택된 아이템
  const [selectedItemIndex, setSelectedItemIndex] = useState(0)

  // 디자인 편집 상태
  const [editedLayers, setEditedLayers] = useState<Record<string, DesignLayer[]>>({})
  const [hasChanges, setHasChanges] = useState(false)

  // 캔버스 상태
  const [currentView, setCurrentView] = useState<HatView>("front")
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  // 현재 선택된 아이템
  const currentItem = order?.items[selectedItemIndex]

  // 현재 아이템의 레이어 (수정된 것 우선)
  const currentLayers = currentItem
    ? editedLayers[currentItem.id] || currentItem.designSnapshot || []
    : []

  // 현재 뷰의 레이어만 필터링
  const viewLayers = currentLayers.filter((l) => l.view === currentView)

  // 수정 가능 여부 (디자인 확정 전까지만)
  const canEdit = order?.status === "pending"

  // 선택된 레이어
  const selectedLayer = currentLayers.find((l) => l.id === selectedLayerId)

  // 주문 데이터 로드
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderNumber}`)
        const data = await response.json()

        if (data.success) {
          setOrder(data.order)
          // 디자인이 있는 첫 번째 뷰로 이동
          const firstItem = data.order.items[0]
          if (firstItem?.designSnapshot?.length > 0) {
            setCurrentView(firstItem.designSnapshot[0].view)
          }
        } else {
          toast.error("주문을 찾을 수 없습니다.")
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("주문 조회 에러:", error)
        toast.error("주문 조회에 실패했습니다.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderNumber, router])

  // 아이템 변경 시 해당 아이템의 디자인이 있는 뷰로 이동
  useEffect(() => {
    if (currentItem) {
      const layers = editedLayers[currentItem.id] || currentItem.designSnapshot || []
      if (layers.length > 0) {
        setCurrentView(layers[0].view)
      }
      setSelectedLayerId(null)
    }
  }, [selectedItemIndex, currentItem?.id])

  // 레이어 업데이트
  const handleLayerUpdate = (layerId: string, updates: Partial<DesignLayer>) => {
    if (!canEdit || !currentItem) return

    const currentItemLayers = editedLayers[currentItem.id] || currentItem.designSnapshot || []
    const updatedLayers = currentItemLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    )

    setEditedLayers((prev) => ({
      ...prev,
      [currentItem.id]: updatedLayers,
    }))
    setHasChanges(true)
  }

  // 레이어 삭제
  const handleLayerRemove = (layerId: string) => {
    if (!canEdit || !currentItem) return

    const currentItemLayers = editedLayers[currentItem.id] || currentItem.designSnapshot || []
    const updatedLayers = currentItemLayers.filter((layer) => layer.id !== layerId)

    setEditedLayers((prev) => ({
      ...prev,
      [currentItem.id]: updatedLayers,
    }))
    setSelectedLayerId(null)
    setHasChanges(true)
  }

  // 레이어 회전
  const handleRotate = (degrees: number) => {
    if (!selectedLayerId || !selectedLayer) return
    handleLayerUpdate(selectedLayerId, {
      rotation: (selectedLayer.rotation + degrees + 360) % 360,
    })
  }

  // 레이어 반전
  const handleFlip = (axis: "x" | "y") => {
    if (!selectedLayerId || !selectedLayer) return
    handleLayerUpdate(selectedLayerId, {
      [axis === "x" ? "flipX" : "flipY"]: axis === "x" ? !selectedLayer.flipX : !selectedLayer.flipY,
    })
  }

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit || !currentItem) return

    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const defaultPos = getDefaultLayerPosition(currentView, config)

      const newLayer: DesignLayer = {
        id: `layer_${Date.now()}`,
        type: "image",
        content,
        ...defaultPos,
        rotation: 0,
        flipX: false,
        flipY: false,
        view: currentView,
      }

      const currentItemLayers = editedLayers[currentItem.id] || currentItem.designSnapshot || []
      setEditedLayers((prev) => ({
        ...prev,
        [currentItem.id]: [...currentItemLayers, newLayer],
      }))
      setSelectedLayerId(newLayer.id)
      setHasChanges(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }

  // 이미지 다운로드 함수
  const handleDownloadImage = async (layer: DesignLayer, index: number) => {
    try {
      const content = layer.content
      let blob: Blob

      if (content.startsWith("data:")) {
        // Base64 이미지 처리
        const base64Data = content.split(",")[1]
        const mimeType = content.split(";")[0].split(":")[1] || "image/png"
        const byteCharacters = atob(base64Data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        blob = new Blob([byteArray], { type: mimeType })
      } else {
        // URL 이미지 처리
        const response = await fetch(content)
        blob = await response.blob()
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const ext = blob.type.split("/")[1] || "png"
      a.download = `${order?.orderNumber}_${layer.view}_design_${index + 1}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("이미지가 다운로드되었습니다")
    } catch (error) {
      console.error("다운로드 에러:", error)
      toast.error("이미지 다운로드에 실패했습니다")
    }
  }

  // 모든 디자인 이미지 다운로드
  const handleDownloadAllImages = async () => {
    if (!order) return

    const imageLayers = order.items.flatMap((item, itemIdx) =>
      (editedLayers[item.id] || item.designSnapshot || [])
        .filter((layer) => layer.type === "image")
        .map((layer, layerIdx) => ({
          layer,
          itemIndex: itemIdx,
          layerIndex: layerIdx,
          colorLabel: item.colorLabel,
        }))
    )

    if (imageLayers.length === 0) {
      toast.info("다운로드할 디자인 이미지가 없습니다")
      return
    }

    toast.info(`${imageLayers.length}개 이미지 다운로드 중...`)

    for (let i = 0; i < imageLayers.length; i++) {
      const { layer, colorLabel, layerIndex } = imageLayers[i]
      try {
        const content = layer.content
        let blob: Blob

        if (content.startsWith("data:")) {
          const base64Data = content.split(",")[1]
          const mimeType = content.split(";")[0].split(":")[1] || "image/png"
          const byteCharacters = atob(base64Data)
          const byteNumbers = new Array(byteCharacters.length)
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j)
          }
          const byteArray = new Uint8Array(byteNumbers)
          blob = new Blob([byteArray], { type: mimeType })
        } else {
          const response = await fetch(content)
          blob = await response.blob()
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        const ext = blob.type.split("/")[1] || "png"
        a.download = `${order.orderNumber}_${colorLabel}_${layer.view}_${layerIndex + 1}.${ext}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // 다운로드 간 딜레이
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (error) {
        console.error("다운로드 에러:", error)
      }
    }

    toast.success("모든 이미지 다운로드 완료")
  }

  // 디자인 저장
  const handleSave = async () => {
    if (!hasChanges || !order) return

    setSaving(true)
    try {
      const response = await fetch(`/api/orders/${orderNumber}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.items.map((item) => ({
            id: item.id,
            designSnapshot: editedLayers[item.id] || item.designSnapshot,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("디자인이 저장되었습니다.")
        setHasChanges(false)
        // 주문 데이터 새로고침
        const refreshResponse = await fetch(`/api/orders/${orderNumber}`)
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setOrder(refreshData.order)
          setEditedLayers({})
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("저장 에러:", error)
      toast.error("디자인 저장에 실패했습니다.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">주문을 찾을 수 없습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 헤더 */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                돌아가기
              </Button>
              <div>
                <h1 className="font-bold text-lg">{order.orderNumber}</h1>
                <p className="text-sm text-gray-500">
                  {order.customerName} · {order.shippingInfo.organizationName || "개인"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={STATUS_COLORS[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              {canEdit ? (
                <Badge variant="outline" className="text-green-600 border-green-300">
                  <Unlock className="w-3 h-3 mr-1" />
                  수정 가능
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  <Lock className="w-3 h-3 mr-1" />
                  수정 불가
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* 좌측: 주문 아이템 목록 */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold text-sm text-gray-500 mb-3">
              주문 상품 ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => {
                const itemLayers = editedLayers[item.id] || item.designSnapshot || []
                const hasDesign = itemLayers.length > 0
                const isEdited = !!editedLayers[item.id]

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItemIndex(index)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedItemIndex === index
                        ? "bg-blue-50 border-2 border-blue-500"
                        : "bg-gray-50 border-2 border-transparent hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full border-2"
                        style={{
                          backgroundColor:
                            config.colors.find((c) => c.id === item.color)?.hex || "#000",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.colorLabel}</p>
                        <p className="text-xs text-gray-500">
                          {item.size} · {item.quantity}개
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {hasDesign && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                          {itemLayers.length}개 디자인
                        </span>
                      )}
                      {isEdited && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                          수정됨
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 주문 정보 요약 */}
          <Separator />
          <div className="p-4 space-y-3 text-sm">
            <div>
              <p className="text-gray-500">배송지</p>
              <p className="font-medium">{order.shippingInfo.recipientName}</p>
              <p className="text-gray-600 text-xs">
                {order.shippingInfo.address} {order.shippingInfo.addressDetail}
              </p>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">총 금액</span>
              <span className="font-bold">{order.totalAmount.toLocaleString()}원</span>
            </div>
          </div>

          {/* 후기 작성 버튼 (배송 완료 시) */}
          {order.status === "delivered" && (
            <>
              <Separator />
              <div className="p-4">
                <Link href={`/gallery/write?order=${order.orderNumber}`}>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    후기 작성하기
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  상품에 대한 후기를 남겨주세요
                </p>
              </div>
            </>
          )}
        </div>

        {/* 중앙: 캔버스 */}
        <div className="flex-1 flex flex-col">
          {/* 뷰 선택 탭 */}
          <div className="bg-white border-b px-4 py-2">
            <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as HatView)}>
              <TabsList>
                {VIEWS.map((view) => {
                  const hasDesignInView = currentLayers.some((l) => l.view === view.id)
                  return (
                    <TabsTrigger key={view.id} value={view.id} className="relative">
                      {view.label}
                      {hasDesignInView && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* 캔버스 영역 */}
          <div className="flex-1 flex items-center justify-center p-8 bg-gray-100">
            <div className="w-full max-w-[600px]">
              <HatDesignCanvas
                hatColor={currentItem?.color || "black"}
                currentView={currentView}
                layers={currentLayers}
                editable={canEdit}
                onLayerUpdate={handleLayerUpdate}
                onLayerRemove={handleLayerRemove}
                onLayerSelect={setSelectedLayerId}
                selectedLayerId={selectedLayerId}
                showSafeZone={true}
                className="w-full rounded-xl shadow-lg bg-white"
              />
            </div>
          </div>
        </div>

        {/* 우측: 도구 패널 */}
        <div className="w-72 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* 모든 이미지 다운로드 버튼 */}
            <Button
              onClick={handleDownloadAllImages}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              모든 디자인 이미지 다운로드
            </Button>

            {/* 저장 버튼 */}
            {canEdit && (
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="w-full"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "저장 중..." : hasChanges ? "디자인 저장" : "저장됨"}
              </Button>
            )}

            {/* 이미지 업로드 */}
            {canEdit && (
              <>
                <Separator />
                <div>
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        이미지 추가
                      </span>
                    </Button>
                  </label>
                </div>
              </>
            )}

            {/* 선택된 레이어 도구 */}
            {canEdit && selectedLayer && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">레이어 편집</h4>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleRotate(-45)}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      -45°
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleRotate(45)}>
                      <RotateCw className="w-4 h-4 mr-1" />
                      +45°
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleFlip("x")}>
                      <FlipHorizontal className="w-4 h-4 mr-1" />
                      좌우
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleFlip("y")}>
                      <FlipVertical className="w-4 h-4 mr-1" />
                      상하
                    </Button>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => handleLayerRemove(selectedLayerId!)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    삭제
                  </Button>

                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    회전: {selectedLayer.rotation}°
                    {selectedLayer.flipX && " · 좌우반전"}
                    {selectedLayer.flipY && " · 상하반전"}
                  </div>
                </div>
              </>
            )}

            {/* 현재 뷰 레이어 목록 */}
            <Separator />
            <div>
              <h4 className="font-medium text-sm mb-2">레이어 ({viewLayers.length})</h4>
              {viewLayers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  이 뷰에 디자인이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {viewLayers.map((layer, index) => (
                    <div
                      key={layer.id}
                      className={`p-2 rounded border text-sm ${
                        selectedLayerId === layer.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => canEdit && setSelectedLayerId(layer.id)}
                      >
                        {layer.type === "image" ? (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <span className="text-xs">Aa</span>
                        )}
                        <span className="truncate flex-1">
                          {layer.type === "image" ? `이미지 ${index + 1}` : layer.content}
                        </span>
                        {layer.type === "image" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownloadImage(layer, index)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title="이미지 다운로드"
                          >
                            <Download className="w-3 h-3 text-gray-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 수정 불가 안내 */}
            {!canEdit && (
              <>
                <Separator />
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">수정 불가</p>
                      <p className="text-yellow-700 text-xs mt-1">
                        디자인이 확정되어 더 이상 수정할 수 없습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
