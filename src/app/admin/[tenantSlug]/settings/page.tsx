"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAdminAuth } from "@/lib/hooks/useAdminAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ArrowLeft, Upload, Loader2, Trash2, Image as ImageIcon, Save } from "lucide-react"
import type { HatView } from "@/lib/store/studio-context"

const VIEW_LABELS: Record<HatView, string> = {
  front: "앞면",
  back: "뒷면",
  left: "왼쪽",
  right: "오른쪽",
  top: "윗면",
}

const ALL_VIEWS: HatView[] = ["front", "back", "left", "right", "top"]

interface TenantData {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  contactEmail: string
  contactPhone: string | null
  settings: {
    basePrice: number
    shippingFreeThreshold: number
    shippingCost: number
    currency: string
    safeZones: Record<HatView, { x: number; y: number; width: number; height: number }>
  }
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const tenantSlugParam = params.tenantSlug as string

  const { isAuthenticated, isLoading: authLoading, tenantSlug } = useAdminAuth()
  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [selectedView, setSelectedView] = useState<HatView>("front")

  // 로컬 상태
  const [localSafeZones, setLocalSafeZones] = useState<Record<HatView, { x: number; y: number; width: number; height: number }> | null>(null)

  const basePath = `/admin/${tenantSlugParam}`

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login")
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        router.push(`/admin/${tenantSlug}/settings`)
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, router])

  // Fetch tenant
  const fetchTenant = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/tenant")
      const json = await res.json()

      if (json.success) {
        setTenant(json.data)
        setLocalSafeZones(json.data.settings.safeZones)
      } else {
        toast.error("테넌트 정보를 불러올 수 없습니다")
      }
    } catch (err) {
      console.error("Failed to fetch tenant:", err)
      toast.error("테넌트 정보를 불러오지 못했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchTenant()
    }
  }, [fetchTenant, isAuthenticated])

  // 로고 업로드
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)

    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string

        const res = await fetch("/api/tenant/logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageData: base64 }),
        })

        const json = await res.json()

        if (json.success) {
          toast.success("로고가 업로드되었습니다")
          fetchTenant()
        } else {
          toast.error(json.error || "로고 업로드 실패")
        }

        setIsUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      console.error("Logo upload error:", err)
      toast.error("로고 업로드 중 오류가 발생했습니다")
      setIsUploadingLogo(false)
    }

    e.target.value = ""
  }

  // 로고 삭제
  const handleLogoDelete = async () => {
    if (!confirm("로고를 삭제하시겠습니까?")) return

    try {
      const res = await fetch("/api/tenant/logo", { method: "DELETE" })
      const json = await res.json()

      if (json.success) {
        toast.success("로고가 삭제되었습니다")
        fetchTenant()
      } else {
        toast.error(json.error || "로고 삭제 실패")
      }
    } catch (err) {
      console.error("Logo delete error:", err)
      toast.error("로고 삭제 중 오류가 발생했습니다")
    }
  }

  // safeZones 업데이트
  const handleZoneChange = (view: HatView, field: 'x' | 'y' | 'width' | 'height', value: number) => {
    if (!localSafeZones) return
    setLocalSafeZones({
      ...localSafeZones,
      [view]: {
        ...localSafeZones[view],
        [field]: value,
      },
    })
  }

  // safeZones 저장
  const handleSaveSafeZones = async () => {
    if (!localSafeZones) return

    setIsSaving(true)
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: { safeZones: localSafeZones },
        }),
      })

      const json = await res.json()

      if (json.success) {
        toast.success("기본 인쇄 영역이 저장되었습니다")
        setTenant(json.data)
      } else {
        toast.error(json.error || "저장 실패")
      }
    } catch (err) {
      console.error("Save safeZones error:", err)
      toast.error("저장 중 오류가 발생했습니다")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!tenant || !localSafeZones) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push(`${basePath}/dashboard`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">테넌트 설정</h1>
          <p className="text-gray-500">
            <span className="font-medium text-blue-600">[{tenantSlugParam}]</span> {tenant.name} - 로고 및 기본 설정 관리
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* 로고 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>로고</CardTitle>
            <CardDescription>
              사이트에 표시될 로고 이미지를 업로드하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              {/* 로고 미리보기 */}
              <div className="w-48 h-48 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group">
                {tenant.logoUrl ? (
                  <>
                    <img
                      src={tenant.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                        />
                        <div className="p-2 bg-white rounded-lg hover:bg-gray-100">
                          <Upload className="h-5 w-5" />
                        </div>
                      </label>
                      <button
                        onClick={handleLogoDelete}
                        className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                    />
                    {isUploadingLogo ? (
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">클릭하여 업로드</span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* 로고 정보 */}
              <div className="flex-1 space-y-2">
                <div className="text-sm text-gray-600">
                  <p>• 권장 크기: 200x200px 이상</p>
                  <p>• 지원 형식: PNG, JPG, SVG</p>
                  <p>• 투명 배경 PNG 권장</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 기본 인쇄 영역 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 인쇄 영역</CardTitle>
            <CardDescription>
              새 상품 등록 시 사용되는 기본 인쇄 가능 영역입니다.
              상품별로 개별 설정이 없을 때 이 값이 적용됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 미리보기 */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="relative w-full aspect-square bg-white border rounded-lg">
                  {/* 가상 모자 영역 */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                    <span className="text-sm">{VIEW_LABELS[selectedView]} 미리보기</span>
                  </div>

                  {/* safeZone 표시 */}
                  <div
                    className="absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
                    style={{
                      left: `${localSafeZones[selectedView].x}%`,
                      top: `${localSafeZones[selectedView].y}%`,
                      width: `${localSafeZones[selectedView].width}%`,
                      height: `${localSafeZones[selectedView].height}%`,
                    }}
                  >
                    <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      PRINT AREA
                    </div>
                  </div>
                </div>
              </div>

              {/* 설정 */}
              <div className="space-y-4">
                {/* 뷰 선택 */}
                <div className="flex gap-2 flex-wrap">
                  {ALL_VIEWS.map((view) => (
                    <Button
                      key={view}
                      size="sm"
                      variant={selectedView === view ? "default" : "outline"}
                      onClick={() => setSelectedView(view)}
                    >
                      {VIEW_LABELS[view]}
                    </Button>
                  ))}
                </div>

                {/* 현재 뷰 설정 */}
                <div className="grid grid-cols-2 gap-3">
                  {(['x', 'y', 'width', 'height'] as const).map((field) => (
                    <div key={field} className="space-y-1">
                      <Label className="text-xs text-gray-500 uppercase">{field} (%)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={localSafeZones[selectedView][field]}
                          onChange={(e) => handleZoneChange(selectedView, field, Number(e.target.value))}
                          className="flex-1"
                        />
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={localSafeZones[selectedView][field]}
                          onChange={(e) => handleZoneChange(selectedView, field, Number(e.target.value))}
                          className="w-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleSaveSafeZones} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  기본 인쇄 영역 저장
                </Button>

                <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                  <p>• 이 설정은 상품별 인쇄 영역이 없을 때 기본값으로 사용됩니다.</p>
                  <p>• 상품별 인쇄 영역은 상품 관리 → 이미지 → 인쇄 영역 설정에서 설정합니다.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 테넌트 정보 (읽기 전용) */}
        <Card>
          <CardHeader>
            <CardTitle>테넌트 정보</CardTitle>
            <CardDescription>
              현재 테넌트 기본 정보입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">테넌트 ID</Label>
                <p className="font-mono text-xs">{tenant.id}</p>
              </div>
              <div>
                <Label className="text-gray-500">슬러그</Label>
                <p>{tenant.slug}</p>
              </div>
              <div>
                <Label className="text-gray-500">이름</Label>
                <p>{tenant.name}</p>
              </div>
              <div>
                <Label className="text-gray-500">연락처 이메일</Label>
                <p>{tenant.contactEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
