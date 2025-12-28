"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useStudioConfig } from "@/lib/store/studio-context"
import { useAdminAuth } from "@/lib/hooks/useAdminAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ExternalLink, RefreshCw, Loader2, Package, ClipboardList, ArrowRight, Cog, LogOut, Settings } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const params = useParams()
  const tenantSlugParam = params.tenantSlug as string

  const { isAuthenticated, isLoading: authLoading, tenantSlug, logout } = useAdminAuth()
  const { config, isLoading, isSaving, error, updateConfig, refreshConfig } = useStudioConfig()

  // Local form states
  const [localShippingCost, setLocalShippingCost] = useState(config.shippingCost)
  const [localShippingFreeThreshold, setLocalShippingFreeThreshold] = useState(config.shippingFreeThreshold)

  // Auth check - 로그인 여부 및 테넌트 권한 확인
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login")
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        // 다른 테넌트 접근 시도 시 자신의 테넌트로 리다이렉트
        router.push(`/admin/${tenantSlug}/dashboard`)
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, router])

  // Sync local state with config
  useEffect(() => {
    setLocalShippingCost(config.shippingCost)
    setLocalShippingFreeThreshold(config.shippingFreeThreshold)
  }, [config.shippingCost, config.shippingFreeThreshold])

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const handleShippingSave = async () => {
    await updateConfig({
      shippingCost: localShippingCost,
      shippingFreeThreshold: localShippingFreeThreshold,
    })
    toast.success("배송비 설정이 저장되었습니다")
  }

  const handleRefresh = async () => {
    await refreshConfig()
    toast.success("설정을 다시 불러왔습니다")
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

  const basePath = `/admin/${tenantSlugParam}`

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500">
            <span className="font-medium text-blue-600">[{tenantSlugParam}]</span> 상품, 주문, 전역 설정을 관리합니다.
          </p>
          {isSaving && (
            <p className="text-sm text-blue-500 mt-1 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              저장 중...
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isSaving}>
            <RefreshCw className="mr-2 h-4 w-4" /> 새로고침
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>
            <ExternalLink className="mr-2 h-4 w-4" /> 사이트
          </Button>
          <Button variant="outline" onClick={logout} className="text-red-500 hover:text-red-600">
            <LogOut className="mr-2 h-4 w-4" /> 로그아웃
          </Button>
        </div>
      </div>

      {/* 빠른 링크 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
          onClick={() => router.push(`${basePath}/products`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              상품 관리
            </CardTitle>
            <CardDescription>
              상품 등록, 색상/사이즈 설정, 이미지 업로드, 인쇄 영역 설정
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-blue-600 font-medium">
              상품 관리로 이동 <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-200"
          onClick={() => router.push(`${basePath}/orders`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
              주문 관리
            </CardTitle>
            <CardDescription>
              주문 확인, 상태 변경, 송장 등록, 디자인 확인
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-green-600 font-medium">
              주문 관리로 이동 <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-200"
          onClick={() => router.push(`${basePath}/settings`)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Cog className="h-6 w-6 text-purple-600" />
              </div>
              테넌트 설정
            </CardTitle>
            <CardDescription>
              로고 업로드, 기본 인쇄 영역, 테넌트 정보
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-purple-600 font-medium">
              테넌트 설정으로 이동 <ArrowRight className="ml-2 h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 전역 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            전역 설정
          </CardTitle>
          <CardDescription>
            모든 상품에 적용되는 배송비 설정입니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>배송비 (KRW)</Label>
              <Input
                type="number"
                value={localShippingCost}
                onChange={(e) => setLocalShippingCost(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">무료배송 기준 미달 시 적용되는 배송비</p>
            </div>
            <div className="space-y-2">
              <Label>무료배송 기준금액 (KRW)</Label>
              <Input
                type="number"
                value={localShippingFreeThreshold}
                onChange={(e) => setLocalShippingFreeThreshold(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">이 금액 이상 주문 시 배송비 무료</p>
            </div>
          </div>
          <Button onClick={handleShippingSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            설정 저장
          </Button>
        </CardContent>
      </Card>

      {/* 안내 메시지 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-medium mb-2">상품별 설정 안내</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>상품 가격</strong>: 상품 관리 → 상품 수정에서 설정</li>
          <li>• <strong>상품 이미지</strong>: 상품 관리 → 이미지 버튼 → 색상별/뷰별 업로드</li>
          <li>• <strong>인쇄 영역</strong>: 상품 관리 → 이미지 버튼 → 인쇄 영역 설정 탭</li>
          <li>• <strong>색상/사이즈</strong>: 상품 관리 → 상품 수정에서 설정</li>
        </ul>
      </div>
    </div>
  )
}
