"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAdminAuth } from "@/lib/hooks/useAdminAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Upload, Loader2, Trash2, Image as ImageIcon, Save, Target, FileText, MessageSquare } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import type { Product, ProductImage, ViewName, CustomizableArea } from "@/domain/product/types"

const VIEW_LABELS: Record<ViewName, string> = {
  front: "앞면",
  back: "뒷면",
  left: "왼쪽",
  right: "오른쪽",
  top: "윗면",
}

const ALL_VIEWS: ViewName[] = ["front", "back", "left", "right", "top"]

// 기본 인쇄 영역 값
const DEFAULT_ZONES: Record<ViewName, { x: number; y: number; width: number; height: number }> = {
  front: { x: 30, y: 30, width: 40, height: 30 },
  back: { x: 30, y: 40, width: 40, height: 20 },
  left: { x: 30, y: 40, width: 40, height: 20 },
  right: { x: 30, y: 40, width: 40, height: 20 },
  top: { x: 25, y: 25, width: 50, height: 50 },
}

interface PrintAreaEditorProps {
  view: ViewName
  colorId: string
  imageUrl: string | null
  area: CustomizableArea | null
  onSave: (area: Partial<CustomizableArea>) => Promise<void>
  isSaving: boolean
}

/**
 * 인쇄 영역 편집기 - 드래그로 영역 설정
 */
function PrintAreaEditor({ view, colorId, imageUrl, area, onSave, isSaving }: PrintAreaEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zone, setZone] = useState({
    x: area?.zoneX ?? DEFAULT_ZONES[view].x,
    y: area?.zoneY ?? DEFAULT_ZONES[view].y,
    width: area?.zoneWidth ?? DEFAULT_ZONES[view].width,
    height: area?.zoneHeight ?? DEFAULT_ZONES[view].height,
  })
  const [isEnabled, setIsEnabled] = useState(area?.isEnabled ?? true)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [prevArea, setPrevArea] = useState(area)

  // 영역이 변경되면 로컬 상태 업데이트 (렌더 시점에 동기화)
  if (area !== prevArea) {
    setPrevArea(area)
    if (area) {
      setZone({
        x: area.zoneX,
        y: area.zoneY,
        width: area.zoneWidth,
        height: area.zoneHeight,
      })
      setIsEnabled(area.isEnabled)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize') => {
    e.preventDefault()
    e.stopPropagation()

    if (type === 'drag') {
      setIsDragging(true)
    } else {
      setIsResizing(true)
    }
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100

    if (isDragging) {
      setZone(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY)),
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    } else if (isResizing) {
      setZone(prev => ({
        ...prev,
        width: Math.max(10, Math.min(100 - prev.x, prev.width + deltaX)),
        height: Math.max(10, Math.min(100 - prev.y, prev.height + deltaY)),
      }))
      setDragStart({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, isResizing, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const handleSave = async () => {
    await onSave({
      colorId,  // 색상 ID 추가
      viewName: view,
      displayName: VIEW_LABELS[view],
      zoneX: Math.round(zone.x * 10) / 10,
      zoneY: Math.round(zone.y * 10) / 10,
      zoneWidth: Math.round(zone.width * 10) / 10,
      zoneHeight: Math.round(zone.height * 10) / 10,
      isEnabled,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label className="text-base font-semibold">{VIEW_LABELS[view]}</Label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-500">
              {isEnabled ? "활성" : "비활성"}
            </span>
          </label>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          저장
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 미리보기 캔버스 */}
        <div
          ref={containerRef}
          className="aspect-square relative bg-gray-100 rounded-lg border overflow-hidden"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${view} preview`}
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="text-sm">이미지를 먼저 업로드하세요</p>
              </div>
            </div>
          )}

          {/* 인쇄 영역 */}
          {isEnabled && (
            <div
              className={`absolute border-2 border-dashed ${
                isDragging || isResizing ? 'border-blue-600 bg-blue-500/20' : 'border-blue-400 bg-blue-400/10'
              } cursor-move transition-colors`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'drag')}
            >
              {/* 영역 라벨 */}
              <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                PRINT AREA
              </div>

              {/* 리사이즈 핸들 */}
              <div
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize rounded-tl"
                onMouseDown={(e) => handleMouseDown(e, 'resize')}
              />
            </div>
          )}
        </div>

        {/* 숫자 입력 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">X 위치 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100 - zone.width}
                step={0.1}
                value={zone.x.toFixed(1)}
                onChange={(e) => setZone(prev => ({ ...prev, x: parseFloat(e.target.value) || 0 }))}
                disabled={!isEnabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Y 위치 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100 - zone.height}
                step={0.1}
                value={zone.y.toFixed(1)}
                onChange={(e) => setZone(prev => ({ ...prev, y: parseFloat(e.target.value) || 0 }))}
                disabled={!isEnabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">너비 (%)</Label>
              <Input
                type="number"
                min={10}
                max={100 - zone.x}
                step={0.1}
                value={zone.width.toFixed(1)}
                onChange={(e) => setZone(prev => ({ ...prev, width: parseFloat(e.target.value) || 10 }))}
                disabled={!isEnabled}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">높이 (%)</Label>
              <Input
                type="number"
                min={10}
                max={100 - zone.y}
                step={0.1}
                value={zone.height.toFixed(1)}
                onChange={(e) => setZone(prev => ({ ...prev, height: parseFloat(e.target.value) || 10 }))}
                disabled={!isEnabled}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600 space-y-1">
            <p>• 파란색 영역을 드래그하여 위치 조정</p>
            <p>• 우하단 모서리를 드래그하여 크기 조정</p>
            <p>• 스튜디오에서 이 영역 안에 디자인 배치 가능</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string
  const tenantSlugParam = params.tenantSlug as string

  const { isAuthenticated, isLoading: authLoading, tenantSlug } = useAdminAuth()
  const [product, setProduct] = useState<Product | null>(null)
  // 색상별 인쇄 영역 저장: { colorId: CustomizableArea[] }
  const [customizableAreasMap, setCustomizableAreasMap] = useState<Record<string, CustomizableArea[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [savingArea, setSavingArea] = useState<string | null>(null)  // "colorId-view" 형식
  const [activeTab, setActiveTab] = useState<"images" | "areas" | "detail" | "message">("images")
  const [uploadingDetailImage, setUploadingDetailImage] = useState(false)
  const [selectedAreaColor, setSelectedAreaColor] = useState<string>("")  // 현재 선택된 색상
  const [adminMessage, setAdminMessage] = useState<string>("")
  const [savingAdminMessage, setSavingAdminMessage] = useState(false)

  const basePath = `/admin/${tenantSlugParam}`

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login")
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        router.push(`/admin/${tenantSlug}/products/${productId}`)
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, productId, router])

  // 특정 색상의 인쇄 영역 가져오기
  const fetchAreasForColor = useCallback(async (colorId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/areas?colorId=${colorId}`)
      const json = await res.json()
      if (json.success) {
        setCustomizableAreasMap(prev => ({
          ...prev,
          [colorId]: json.data
        }))
      }
    } catch (err) {
      console.error(`Failed to fetch areas for color ${colorId}:`, err)
    }
  }, [productId])

  // Fetch product and initial areas
  const fetchProduct = useCallback(async () => {
    try {
      setIsLoading(true)
      const productRes = await fetch(`/api/products/${productId}`)
      const productJson = await productRes.json()

      if (productJson.success) {
        setProduct(productJson.data)
        // 관리자 메시지 로드
        setAdminMessage(productJson.data.adminMessage || "")
        // 첫 번째 색상을 기본 선택
        if (productJson.data.variants?.length > 0) {
          const firstColorId = productJson.data.variants[0].id
          setSelectedAreaColor(firstColorId)
          // 첫 번째 색상의 영역 로드
          await fetchAreasForColor(firstColorId)
        }
      } else {
        toast.error("상품을 찾을 수 없습니다")
        router.push(`${basePath}/products`)
        return
      }
    } catch (err) {
      console.error("Failed to fetch product:", err)
      toast.error("상품 정보를 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [productId, basePath, router, fetchAreasForColor])

  useEffect(() => {
    if (productId && isAuthenticated) {
      fetchProduct()
    }
  }, [productId, fetchProduct, isAuthenticated])

  // 이미지 업로드 핸들러
  const handleImageUpload = async (
    colorId: string,
    view: ViewName,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file || !product) return

    const uploadKey = `${colorId}-${view}`
    setUploadingImage(uploadKey)

    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string

        const res = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            colorId,
            view,
            imageData: base64,
          }),
        })

        const json = await res.json()

        if (json.success) {
          toast.success(`${VIEW_LABELS[view]} 이미지가 업로드되었습니다`)
          fetchProduct()
        } else {
          toast.error(json.error || "업로드 실패")
        }

        setUploadingImage(null)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("이미지 업로드 중 오류가 발생했습니다")
      setUploadingImage(null)
    }

    e.target.value = ""
  }

  // 이미지 삭제 핸들러
  const handleImageDelete = async (colorId: string, view: ViewName) => {
    if (!confirm("이미지를 삭제하시겠습니까?")) return

    try {
      const res = await fetch(
        `/api/products/${productId}/images?colorId=${colorId}&view=${view}`,
        { method: "DELETE" }
      )
      const json = await res.json()

      if (json.success) {
        toast.success("이미지가 삭제되었습니다")
        fetchProduct()
      } else {
        toast.error(json.error || "삭제 실패")
      }
    } catch (err) {
      console.error("Delete error:", err)
      toast.error("이미지 삭제 중 오류가 발생했습니다")
    }
  }

  // 제품 상세 이미지 업로드 핸들러
  const handleDetailImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !product) return

    setUploadingDetailImage(true)

    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string

        const res = await fetch(`/api/products/${productId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "detail",
            imageData: base64,
          }),
        })

        const json = await res.json()

        if (json.success) {
          toast.success("제품 상세 이미지가 업로드되었습니다")
          fetchProduct()
        } else {
          toast.error(json.error || "업로드 실패")
        }

        setUploadingDetailImage(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Detail image upload error:", err)
      toast.error("제품 상세 이미지 업로드 중 오류가 발생했습니다")
      setUploadingDetailImage(false)
    }

    e.target.value = ""
  }

  // 제품 상세 이미지 삭제 핸들러
  const handleDetailImageDelete = async () => {
    if (!confirm("제품 상세 이미지를 삭제하시겠습니까?")) return

    try {
      const res = await fetch(
        `/api/products/${productId}/images?type=detail`,
        { method: "DELETE" }
      )
      const json = await res.json()

      if (json.success) {
        toast.success("제품 상세 이미지가 삭제되었습니다")
        fetchProduct()
      } else {
        toast.error(json.error || "삭제 실패")
      }
    } catch (err) {
      console.error("Detail image delete error:", err)
      toast.error("제품 상세 이미지 삭제 중 오류가 발생했습니다")
    }
  }

  // 관리자 메시지 저장
  const handleSaveAdminMessage = async () => {
    setSavingAdminMessage(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminMessage: adminMessage.trim() || null,
        }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success("주문 안내 메시지가 저장되었습니다")
        setProduct(json.data)
      } else {
        toast.error(json.error || "저장 실패")
      }
    } catch (err) {
      console.error("Save admin message error:", err)
      toast.error("주문 안내 메시지 저장 중 오류가 발생했습니다")
    } finally {
      setSavingAdminMessage(false)
    }
  }

  // 인쇄 영역 저장
  const handleSaveArea = async (colorId: string, view: ViewName, areaData: Partial<CustomizableArea>) => {
    const savingKey = `${colorId}-${view}`
    setSavingArea(savingKey)
    try {
      const res = await fetch(`/api/products/${productId}/areas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(areaData),
      })
      const json = await res.json()

      if (json.success) {
        toast.success(`${VIEW_LABELS[view]} 인쇄 영역이 저장되었습니다`)
        // 로컬 상태 업데이트
        setCustomizableAreasMap(prev => {
          const colorAreas = prev[colorId] || []
          const existing = colorAreas.findIndex(a => a.viewName === view && a.colorId === colorId)
          if (existing >= 0) {
            const updated = [...colorAreas]
            updated[existing] = json.data
            return { ...prev, [colorId]: updated }
          }
          return { ...prev, [colorId]: [...colorAreas, json.data] }
        })
      } else {
        toast.error(json.error || "저장 실패")
      }
    } catch (err) {
      console.error("Save area error:", err)
      toast.error("인쇄 영역 저장 중 오류가 발생했습니다")
    } finally {
      setSavingArea(null)
    }
  }

  // 특정 색상+뷰의 이미지 URL 가져오기
  const getImageUrl = (colorId: string, view: ViewName): string | null => {
    if (!product?.images) return null
    const img = product.images.find(
      (i) => i.colorId === colorId && i.view === view
    )
    return img?.url || null
  }

  // 특정 색상+뷰의 인쇄 영역 가져오기
  // 색상별 영역이 있으면 우선, 없으면 공통(colorId=null) 영역 반환
  const getAreaForViewAndColor = (view: ViewName, colorId: string): CustomizableArea | null => {
    const colorAreas = customizableAreasMap[colorId] || []

    // 먼저 해당 색상의 영역 찾기
    const colorSpecificArea = colorAreas.find(a => a.viewName === view && a.colorId === colorId)
    if (colorSpecificArea) return colorSpecificArea

    // 없으면 공통 영역(colorId가 null) 찾기
    const commonArea = colorAreas.find(a => a.viewName === view && !a.colorId)
    return commonArea || null
  }

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push(`${basePath}/products`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-500">
            <span className="font-medium text-blue-600">[{tenantSlugParam}]</span> /{product.slug} - 이미지 및 인쇄 영역 관리
          </p>
        </div>
      </div>

      {/* 메인 탭: 이미지 / 인쇄 영역 / 제품 상세 / 주문 안내 */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "images" | "areas" | "detail" | "message")}>
        <TabsList className="mb-6">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            상품 이미지
          </TabsTrigger>
          <TabsTrigger value="areas" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            인쇄 영역 설정
          </TabsTrigger>
          <TabsTrigger value="detail" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            제품 상세
          </TabsTrigger>
          <TabsTrigger value="message" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            주문 안내
          </TabsTrigger>
        </TabsList>

        {/* 이미지 탭 */}
        <TabsContent value="images">
          <Tabs defaultValue={product.variants[0]?.id || "default"}>
            <TabsList className="mb-6">
              {product.variants.map((variant) => (
                <TabsTrigger key={variant.id} value={variant.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: variant.hex }}
                  />
                  {variant.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {product.variants.map((variant) => (
              <TabsContent key={variant.id} value={variant.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: variant.hex }}
                      />
                      {variant.label} 이미지
                    </CardTitle>
                    <CardDescription>
                      각 뷰별로 이미지를 업로드하세요. 이미지는 스튜디오에서 사용됩니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                      {ALL_VIEWS.map((view) => {
                        const imageUrl = getImageUrl(variant.id, view)
                        const uploadKey = `${variant.id}-${view}`
                        const isUploading = uploadingImage === uploadKey

                        return (
                          <div key={view} className="space-y-2">
                            <Label className="text-sm font-medium">
                              {VIEW_LABELS[view]}
                            </Label>
                            <div className="aspect-square relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden group">
                              {imageUrl ? (
                                <>
                                  <img
                                    src={imageUrl}
                                    alt={`${variant.label} ${view}`}
                                    className="w-full h-full object-contain"
                                  />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageUpload(variant.id, view, e)}
                                        disabled={isUploading}
                                      />
                                      <div className="p-2 bg-white rounded-lg hover:bg-gray-100">
                                        <Upload className="h-4 w-4" />
                                      </div>
                                    </label>
                                    <button
                                      onClick={() => handleImageDelete(variant.id, view)}
                                      className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(variant.id, view, e)}
                                    disabled={isUploading}
                                  />
                                  {isUploading ? (
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                                  ) : (
                                    <>
                                      <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                                      <span className="text-xs text-gray-500">클릭하여 업로드</span>
                                    </>
                                  )}
                                </label>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* 인쇄 영역 탭 - 색상별 설정 */}
        <TabsContent value="areas">
          <Tabs
            value={selectedAreaColor}
            onValueChange={(colorId) => {
              setSelectedAreaColor(colorId)
              // 해당 색상의 영역이 로드되지 않았으면 로드
              if (!customizableAreasMap[colorId]) {
                fetchAreasForColor(colorId)
              }
            }}
          >
            <TabsList className="mb-6">
              {product.variants.map((variant) => (
                <TabsTrigger key={variant.id} value={variant.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: variant.hex }}
                  />
                  {variant.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {product.variants.map((variant) => (
              <TabsContent key={variant.id} value={variant.id}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: variant.hex }}
                      />
                      {variant.label} 인쇄 영역 설정
                    </CardTitle>
                    <CardDescription>
                      이 색상의 각 뷰별 인쇄 가능 영역을 설정합니다.
                      스튜디오에서 사용자가 이 영역 안에만 디자인을 배치할 수 있습니다.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {ALL_VIEWS.map((view) => (
                      <div key={view} className="border-b pb-8 last:border-b-0 last:pb-0">
                        <PrintAreaEditor
                          view={view}
                          colorId={variant.id}
                          imageUrl={getImageUrl(variant.id, view)}
                          area={getAreaForViewAndColor(view, variant.id)}
                          onSave={(areaData) => handleSaveArea(variant.id, view, areaData)}
                          isSaving={savingArea === `${variant.id}-${view}`}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </TabsContent>

        {/* 제품 상세 탭 */}
        <TabsContent value="detail">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                제품 상세 이미지
              </CardTitle>
              <CardDescription>
                스튜디오 페이지 하단에 표시되는 제품 상세 정보 이미지입니다.
                세로로 긴 이미지(예: 750x6472)도 지원됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {product.detailImageUrl ? (
                <div className="space-y-4">
                  {/* 이미지 미리보기 */}
                  <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                    <div className="max-h-[600px] overflow-y-auto">
                      <img
                        src={product.detailImageUrl}
                        alt="제품 상세"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleDetailImageUpload}
                          disabled={uploadingDetailImage}
                        />
                        <div className="p-2 bg-white rounded-lg shadow hover:bg-gray-100 transition-colors">
                          {uploadingDetailImage ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </div>
                      </label>
                      <button
                        onClick={handleDetailImageDelete}
                        className="p-2 bg-white rounded-lg shadow hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    스크롤하여 전체 이미지를 확인할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
                  <label className="cursor-pointer flex flex-col items-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleDetailImageUpload}
                      disabled={uploadingDetailImage}
                    />
                    {uploadingDetailImage ? (
                      <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
                    ) : (
                      <FileText className="h-12 w-12 text-gray-400 mb-4" />
                    )}
                    <span className="text-lg font-medium text-gray-600 mb-2">
                      제품 상세 이미지 업로드
                    </span>
                    <span className="text-sm text-gray-500">
                      클릭하여 이미지를 선택하세요
                    </span>
                  </label>
                </div>
              )}

              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">이미지 가이드</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 권장 너비: 750px 이상</li>
                  <li>• 세로로 긴 이미지 지원 (제품 사양, 사이즈 가이드 등)</li>
                  <li>• 스튜디오 페이지에서 커스터마이징 영역 아래에 표시됩니다</li>
                  <li>• 고객이 자연스럽게 스크롤하여 확인할 수 있도록 스크롤 힌트가 표시됩니다</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 주문 안내 메시지 탭 */}
        <TabsContent value="message">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                주문 전 안내 메시지
              </CardTitle>
              <CardDescription>
                이 메시지는 장바구니에서 고객이 주문 전 반드시 확인해야 합니다.
                고객은 체크박스를 선택해야 주문을 진행할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminMessage">안내 메시지</Label>
                <Textarea
                  id="adminMessage"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="예: 해당 상품은 주문 후 제작이 들어가는 상품으로, 배송까지 7~10일 정도 소요됩니다.

* 자세한 안내사항은 별도 연락을 드리겠습니다
* 제작이 들어가는 상품으로, 주문 후 취소 및 변경이 불가합니다."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <Button
                onClick={handleSaveAdminMessage}
                disabled={savingAdminMessage}
                className="w-full sm:w-auto"
              >
                {savingAdminMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                저장
              </Button>

              <div className="mt-6 bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">안내 메시지 사용법</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• 고객이 장바구니에서 주문하기 전에 이 메시지를 확인합니다</li>
                  <li>• 고객은 &quot;위 내용을 확인했습니다&quot; 체크박스를 선택해야 주문을 진행할 수 있습니다</li>
                  <li>• 메시지를 비우면 해당 상품에 대한 안내 메시지가 표시되지 않습니다</li>
                  <li>• 줄바꿈을 사용하여 여러 항목을 구분할 수 있습니다</li>
                </ul>
              </div>

              {adminMessage && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">미리보기</h4>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{adminMessage}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
