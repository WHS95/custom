"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAdminAuth } from "@/lib/hooks/useAdminAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Package,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Clock,
  Truck,
  Factory,
  Palette,
  PackageCheck,
  XCircle,
  Building,
  Phone,
  MapPin,
  ArrowLeft,
  Loader2,
  User,
  Mail,
  CreditCard,
  Save,
  X,
  History,
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react"
import { toast } from "sonner"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  CARRIER_LABELS,
  CARRIER_TRACKING_URLS,
  type OrderStatus,
  type CarrierCode,
} from "@/domain/order"

interface OrderItem {
  id: string
  productName: string
  color: string
  colorLabel: string
  size: string
  quantity: number
  unitPrice: number
  totalPrice: number
  designSnapshot: {
    id: string
    type: string
    content: string
    view: string
  }[]
}

interface TrackingInfo {
  carrier: CarrierCode
  trackingNumber: string
  shippedAt: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  shippingInfo: {
    recipientName: string
    phone: string
    zipCode?: string
    address: string
    addressDetail?: string
    organizationName?: string
    memo?: string
  }
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  totalAmount: number
  status: OrderStatus
  adminMemo?: string
  trackingInfo?: TrackingInfo
  createdAt: string
  updatedAt: string
}

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  pending: Clock,
  design_confirmed: Palette,
  preparing: Factory,
  in_production: Factory,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  design_confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  preparing: "bg-purple-100 text-purple-700 border-purple-200",
  in_production: "bg-orange-100 text-orange-700 border-orange-200",
  shipped: "bg-cyan-100 text-cyan-700 border-cyan-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const params = useParams()
  const tenantSlugParam = params.tenantSlug as string

  const { isAuthenticated, isLoading: authLoading, tenantSlug } = useAdminAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [shippingCopied, setShippingCopied] = useState(false)
  const [showProductSummary, setShowProductSummary] = useState(false)

  // 수정용 폼 상태
  const [formData, setFormData] = useState({
    // 고객 정보
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    // 배송 정보
    recipientName: "",
    recipientPhone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    organizationName: "",
    shippingMemo: "",
    // 상태 정보
    status: "" as OrderStatus | "",
    statusMemo: "",
    adminMemo: "",
    // 배송 추적
    carrier: "cj" as CarrierCode,
    trackingNumber: "",
  })

  const basePath = `/admin/${tenantSlugParam}`

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login")
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        router.push(`/admin/${tenantSlug}/orders`)
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders()
    }
  }, [statusFilter, isAuthenticated])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      let url = "/api/orders?admin=true"
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`
      }
      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders)
      }
    } catch (error) {
      console.error("주문 목록 조회 에러:", error)
      toast.error("주문 목록을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  // 주문 상세 모달 열기
  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setFormData({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || "",
      recipientName: order.shippingInfo.recipientName,
      recipientPhone: order.shippingInfo.phone,
      zipCode: order.shippingInfo.zipCode || "",
      address: order.shippingInfo.address,
      addressDetail: order.shippingInfo.addressDetail || "",
      organizationName: order.shippingInfo.organizationName || "",
      shippingMemo: order.shippingInfo.memo || "",
      status: order.status,
      statusMemo: "",
      adminMemo: order.adminMemo || "",
      carrier: order.trackingInfo?.carrier || "cj",
      trackingNumber: order.trackingInfo?.trackingNumber || "",
    })
    setEditMode(false)
    setOrderDetailOpen(true)
  }

  // 주문 정보 저장
  const handleSaveOrder = async () => {
    if (!selectedOrder) return

    setUpdating(true)
    try {
      const body: Record<string, unknown> = {}

      // 상태 변경
      if (formData.status && formData.status !== selectedOrder.status) {
        body.status = formData.status
        body.changedBy = "admin"
        if (formData.statusMemo) {
          body.statusMemo = formData.statusMemo
        }
      }

      // 관리자 메모 변경
      if (formData.adminMemo !== (selectedOrder.adminMemo || "")) {
        body.adminMemo = formData.adminMemo
      }

      // 고객 정보 및 배송 정보 변경
      const customerChanged =
        formData.customerName !== selectedOrder.customerName ||
        formData.customerPhone !== selectedOrder.customerPhone ||
        formData.customerEmail !== (selectedOrder.customerEmail || "")

      const shippingChanged =
        formData.recipientName !== selectedOrder.shippingInfo.recipientName ||
        formData.recipientPhone !== selectedOrder.shippingInfo.phone ||
        formData.zipCode !== (selectedOrder.shippingInfo.zipCode || "") ||
        formData.address !== selectedOrder.shippingInfo.address ||
        formData.addressDetail !== (selectedOrder.shippingInfo.addressDetail || "") ||
        formData.organizationName !== (selectedOrder.shippingInfo.organizationName || "") ||
        formData.shippingMemo !== (selectedOrder.shippingInfo.memo || "")

      if (customerChanged) {
        body.customerName = formData.customerName
        body.customerPhone = formData.customerPhone
        body.customerEmail = formData.customerEmail
      }

      if (shippingChanged) {
        body.shippingInfo = {
          recipientName: formData.recipientName,
          phone: formData.recipientPhone,
          zipCode: formData.zipCode,
          address: formData.address,
          addressDetail: formData.addressDetail,
          organizationName: formData.organizationName,
          memo: formData.shippingMemo,
        }
      }

      if (Object.keys(body).length === 0) {
        toast.info("변경사항이 없습니다.")
        setEditMode(false)
        return
      }

      const response = await fetch(`/api/orders/${selectedOrder.orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("주문이 업데이트되었습니다.")
        setEditMode(false)
        setOrderDetailOpen(false)
        fetchOrders()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("주문 업데이트 에러:", error)
      toast.error("주문 업데이트에 실패했습니다.")
    } finally {
      setUpdating(false)
    }
  }

  // 송장 등록
  const handleRegisterShipping = async () => {
    if (!selectedOrder) return
    if (!formData.trackingNumber.trim()) {
      toast.error("송장번호를 입력해주세요.")
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/orders/${selectedOrder.orderNumber}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carrier: formData.carrier,
          trackingNumber: formData.trackingNumber.trim(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("송장이 등록되었습니다.")
        setOrderDetailOpen(false)
        fetchOrders()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("송장 등록 에러:", error)
      toast.error("송장 등록에 실패했습니다.")
    } finally {
      setUpdating(false)
    }
  }

  // 배송지 정보 복사
  const handleCopyShippingInfo = async () => {
    if (!selectedOrder) return
    const info = selectedOrder.shippingInfo
    const lines = [
      `수령인: ${info.recipientName}`,
      `연락처: ${info.phone}`,
      `주소: ${info.zipCode ? `[${info.zipCode}] ` : ""}${info.address}${info.addressDetail ? ` ${info.addressDetail}` : ""}`,
    ]
    if (info.organizationName) {
      lines.push(`단체명: ${info.organizationName}`)
    }
    if (info.memo) {
      lines.push(`배송메모: ${info.memo}`)
    }
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      setShippingCopied(true)
      toast.success("배송지 정보가 복사되었습니다.")
      setTimeout(() => setShippingCopied(false), 2000)
    } catch {
      toast.error("복사에 실패했습니다.")
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.customerPhone.includes(query) ||
      order.shippingInfo.organizationName?.toLowerCase().includes(query)
    )
  })

  // 제품별 주문 현황 집계 (취소 주문 제외)
  const productSummary = (() => {
    const summary: Record<string, Record<string, Record<string, number>>> = {}
    orders
      .filter((order) => order.status !== "cancelled")
      .forEach((order) => {
        order.items.forEach((item) => {
          if (!summary[item.productName]) summary[item.productName] = {}
          if (!summary[item.productName][item.colorLabel]) summary[item.productName][item.colorLabel] = {}
          summary[item.productName][item.colorLabel][item.size] =
            (summary[item.productName][item.colorLabel][item.size] || 0) + item.quantity
        })
      })
    return summary
  })()

  // 상태별 카운트
  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<OrderStatus, number>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push(`${basePath}/dashboard`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">주문 관리</h1>
            <p className="text-gray-600">
              <span className="font-medium text-blue-600">[{tenantSlugParam}]</span> 모든 주문을 관리하고 상태를 업데이트하세요.
            </p>
          </div>
        </div>

        {/* 상태별 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {(["all", ...ORDER_STATUS_ORDER, "cancelled"] as const).map((status) => {
            const count =
              status === "all"
                ? orders.length
                : statusCounts[status as OrderStatus] || 0
            const Icon =
              status === "all" ? Package : STATUS_ICONS[status as OrderStatus]
            const isActive = statusFilter === status

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`p-3 rounded-lg border transition-all ${
                  isActive
                    ? "bg-black text-white border-black"
                    : "bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-4 h-4" />
                  <span className="text-lg font-bold">{count}</span>
                </div>
                <p className="text-xs truncate">
                  {status === "all"
                    ? "전체"
                    : ORDER_STATUS_LABELS[status as OrderStatus]}
                </p>
              </button>
            )
          })}
        </div>

        {/* 검색 및 새로고침 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="주문번호, 고객명, 전화번호, 단체명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={fetchOrders} disabled={loading}>
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 제품별 주문 현황 */}
        {Object.keys(productSummary).length > 0 && (
          <Card className="mb-6">
            <CardHeader
              className="pb-2 cursor-pointer"
              onClick={() => setShowProductSummary(!showProductSummary)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  제품별 주문 현황
                  <span className="text-xs font-normal text-gray-500">(취소 제외)</span>
                </CardTitle>
                {showProductSummary ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </CardHeader>
            {showProductSummary && (
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(productSummary).map(([productName, colors]) => (
                    <div key={productName}>
                      <p className="font-medium text-sm mb-2">{productName}</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-gray-50">
                              <th className="text-left p-2 text-gray-500 font-medium">컬러</th>
                              <th className="text-left p-2 text-gray-500 font-medium">사이즈</th>
                              <th className="text-right p-2 text-gray-500 font-medium">수량</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {Object.entries(colors).map(([colorLabel, sizes]) =>
                              Object.entries(sizes).map(([size, qty], idx) => (
                                <tr key={`${colorLabel}-${size}`} className="hover:bg-gray-50">
                                  {idx === 0 ? (
                                    <td
                                      className="p-2 font-medium"
                                      rowSpan={Object.keys(sizes).length}
                                    >
                                      {colorLabel}
                                    </td>
                                  ) : null}
                                  <td className="p-2">{size}</td>
                                  <td className="p-2 text-right font-bold">{qty}개</td>
                                </tr>
                              ))
                            )}
                            <tr className="bg-gray-50 font-bold">
                              <td className="p-2" colSpan={2}>소계</td>
                              <td className="p-2 text-right">
                                {Object.values(colors).reduce(
                                  (sum, sizes) => sum + Object.values(sizes).reduce((s, q) => s + q, 0),
                                  0
                                )}개
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* 주문 목록 테이블 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">주문번호</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">고객정보</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">단체명</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">상품</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">금액</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">상태</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">배송정보</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">주문일시</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        주문이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const Icon = STATUS_ICONS[order.status]
                      const totalQuantity = order.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )

                      return (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="p-4">
                            <p className="font-mono font-bold text-sm">{order.orderNumber}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-sm">{order.customerName}</p>
                            <p className="text-xs text-gray-500">{order.customerPhone}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{order.shippingInfo.organizationName || "-"}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">{order.items.length}종 / {totalQuantity}개</p>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-sm">{order.totalAmount.toLocaleString()}원</p>
                          </td>
                          <td className="p-4">
                            <Badge className={`${STATUS_COLORS[order.status]} border`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </td>
                          <td className="p-4">
                            {order.trackingInfo ? (
                              <div className="text-xs">
                                <p className="font-medium">{CARRIER_LABELS[order.trackingInfo.carrier]}</p>
                                <a
                                  href={CARRIER_TRACKING_URLS[order.trackingInfo.carrier](order.trackingInfo.trackingNumber)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-500 hover:underline"
                                >
                                  {order.trackingInfo.trackingNumber}
                                </a>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString("ko-KR", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenOrderDetail(order)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              상세
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 주문 상세/수정 통합 모달 */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  주문 상세
                  {selectedOrder && (
                    <Badge className={`${STATUS_COLORS[selectedOrder.status]} border ml-2`}>
                      {ORDER_STATUS_LABELS[selectedOrder.status]}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="font-mono text-base mt-1">
                  {selectedOrder?.orderNumber}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {!editMode ? (
                  <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    수정
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                      <X className="w-4 h-4 mr-1" />
                      취소
                    </Button>
                    <Button size="sm" onClick={handleSaveOrder} disabled={updating}>
                      <Save className="w-4 h-4 mr-1" />
                      {updating ? "저장 중..." : "저장"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="info">기본 정보</TabsTrigger>
                <TabsTrigger value="items">상품</TabsTrigger>
                <TabsTrigger value="shipping">배송</TabsTrigger>
                <TabsTrigger value="admin">관리</TabsTrigger>
              </TabsList>

              {/* 기본 정보 탭 */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* 주문자 정보 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        주문자 정보
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {editMode ? (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">이름</Label>
                            <Input
                              value={formData.customerName}
                              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">연락처</Label>
                            <Input
                              value={formData.customerPhone}
                              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">이메일</Label>
                            <Input
                              value={formData.customerEmail}
                              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{selectedOrder.customerName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{selectedOrder.customerPhone}</span>
                          </div>
                          {selectedOrder.customerEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span>{selectedOrder.customerEmail}</span>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* 배송지 정보 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          배송지 정보
                        </CardTitle>
                        {!editMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
                            onClick={handleCopyShippingInfo}
                          >
                            {shippingCopied ? (
                              <Check className="w-3.5 h-3.5 mr-1 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 mr-1" />
                            )}
                            {shippingCopied ? "복사됨" : "복사"}
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {editMode ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">수령인</Label>
                              <Input
                                value={formData.recipientName}
                                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">연락처</Label>
                              <Input
                                value={formData.recipientPhone}
                                onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">단체명</Label>
                            <Input
                              value={formData.organizationName}
                              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs text-gray-500">우편번호</Label>
                              <Input
                                value={formData.zipCode}
                                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                              />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label className="text-xs text-gray-500">주소</Label>
                              <Input
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">상세주소</Label>
                            <Input
                              value={formData.addressDetail}
                              onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">배송 메모</Label>
                            <Input
                              value={formData.shippingMemo}
                              onChange={(e) => setFormData({ ...formData, shippingMemo: e.target.value })}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium">{selectedOrder.shippingInfo.recipientName}</span>
                            <span className="text-gray-400">|</span>
                            <span>{selectedOrder.shippingInfo.phone}</span>
                          </div>
                          {selectedOrder.shippingInfo.organizationName && (
                            <div className="flex items-center gap-2 text-sm">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span>{selectedOrder.shippingInfo.organizationName}</span>
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            {selectedOrder.shippingInfo.zipCode && (
                              <span className="text-gray-400">[{selectedOrder.shippingInfo.zipCode}] </span>
                            )}
                            {selectedOrder.shippingInfo.address}
                            {selectedOrder.shippingInfo.addressDetail && (
                              <span> {selectedOrder.shippingInfo.addressDetail}</span>
                            )}
                          </div>
                          {selectedOrder.shippingInfo.memo && (
                            <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                              배송메모: {selectedOrder.shippingInfo.memo}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* 결제 정보 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      결제 정보
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1 text-sm">
                        <div className="flex gap-4">
                          <span className="text-gray-500">상품 합계</span>
                          <span>{selectedOrder.subtotal.toLocaleString()}원</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="text-gray-500">배송비</span>
                          <span>{selectedOrder.shippingCost === 0 ? "무료" : `${selectedOrder.shippingCost.toLocaleString()}원`}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">총 결제금액</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedOrder.totalAmount.toLocaleString()}원</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 상품 탭 */}
              <TabsContent value="items" className="mt-4 space-y-4">
                {/* 디자인 확인 버튼 */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-900">디자인 상세 확인</p>
                          <p className="text-sm text-blue-600">스튜디오 화면에서 디자인을 확인하세요</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          window.open(`/order/${selectedOrder.orderNumber}`, '_blank')
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        디자인 보기
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 상품 목록 */}
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-gray-500">{item.colorLabel} / {item.size}</p>
                              <p className="text-sm">{item.unitPrice.toLocaleString()}원 × {item.quantity}개</p>
                            </div>
                          </div>
                          <p className="text-lg font-bold">{item.totalPrice.toLocaleString()}원</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* 배송 탭 */}
              <TabsContent value="shipping" className="mt-4 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      배송 추적
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedOrder.trackingInfo ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{CARRIER_LABELS[selectedOrder.trackingInfo.carrier]}</p>
                            <p className="text-lg font-mono">{selectedOrder.trackingInfo.trackingNumber}</p>
                            <p className="text-sm text-gray-500">
                              발송일: {new Date(selectedOrder.trackingInfo.shippedAt).toLocaleString("ko-KR")}
                            </p>
                          </div>
                          <a
                            href={CARRIER_TRACKING_URLS[selectedOrder.trackingInfo.carrier](selectedOrder.trackingInfo.trackingNumber)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          >
                            배송 조회
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <p className="text-yellow-700">아직 송장이 등록되지 않았습니다.</p>
                        </div>

                        {!["shipped", "delivered", "cancelled"].includes(selectedOrder.status) && (
                          <div className="border rounded-lg p-4 space-y-3">
                            <p className="font-medium">송장 등록</p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">택배사</Label>
                                <Select
                                  value={formData.carrier}
                                  onValueChange={(value) => setFormData({ ...formData, carrier: value as CarrierCode })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(Object.keys(CARRIER_LABELS) as CarrierCode[]).map((code) => (
                                      <SelectItem key={code} value={code}>
                                        {CARRIER_LABELS[code]}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-gray-500">송장번호</Label>
                                <Input
                                  placeholder="송장번호 입력"
                                  value={formData.trackingNumber}
                                  onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                                />
                              </div>
                            </div>
                            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700">
                              송장 등록 시 주문 상태가 자동으로 &quot;배송 중&quot;으로 변경됩니다.
                            </div>
                            <Button
                              onClick={handleRegisterShipping}
                              disabled={updating || !formData.trackingNumber.trim()}
                              className="w-full"
                            >
                              {updating ? "등록 중..." : "송장 등록"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 관리 탭 */}
              <TabsContent value="admin" className="mt-4 space-y-4">
                {/* 주문 상태 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <History className="w-4 h-4" />
                      주문 상태
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">현재 상태</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value as OrderStatus })}
                        disabled={!editMode}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...ORDER_STATUS_ORDER, "cancelled"].map((status) => (
                            <SelectItem key={status} value={status}>
                              {ORDER_STATUS_LABELS[status as OrderStatus]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {editMode && formData.status !== selectedOrder.status && (
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">상태 변경 메모 (선택)</Label>
                        <Input
                          placeholder="고객에게 표시될 메모"
                          value={formData.statusMemo}
                          onChange={(e) => setFormData({ ...formData, statusMemo: e.target.value })}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 관리자 메모 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      관리자 메모
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="내부용 메모 (고객에게 표시되지 않음)"
                      value={formData.adminMemo}
                      onChange={(e) => setFormData({ ...formData, adminMemo: e.target.value })}
                      rows={4}
                      disabled={!editMode}
                    />
                  </CardContent>
                </Card>

                {/* 주문 이력 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      주문 이력
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">주문 생성</span>
                      <span>{new Date(selectedOrder.createdAt).toLocaleString("ko-KR")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">마지막 수정</span>
                      <span>{new Date(selectedOrder.updatedAt).toLocaleString("ko-KR")}</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
