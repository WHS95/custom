"use client"

import { useState, useEffect } from "react"
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
  CheckCircle,
  Truck,
  Factory,
  Palette,
  PackageCheck,
  XCircle,
  Building,
  Phone,
  MapPin,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  type OrderStatus,
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("")
  const [statusMemo, setStatusMemo] = useState("")
  const [adminMemo, setAdminMemo] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

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

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setDetailDialogOpen(true)
  }

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setStatusMemo("")
    setAdminMemo(order.adminMemo || "")
    setEditDialogOpen(true)
  }

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return

    setUpdating(true)
    try {
      const body: Record<string, string> = {}

      if (newStatus && newStatus !== selectedOrder.status) {
        body.status = newStatus
        body.changedBy = "admin"
        if (statusMemo) {
          body.statusMemo = statusMemo
        }
      }

      if (adminMemo !== selectedOrder.adminMemo) {
        body.adminMemo = adminMemo
      }

      if (Object.keys(body).length === 0) {
        toast.info("변경사항이 없습니다.")
        setEditDialogOpen(false)
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
        setEditDialogOpen(false)
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

  // 상태별 카운트
  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<OrderStatus, number>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">주문 관리</h1>
          <p className="text-gray-600">모든 주문을 관리하고 상태를 업데이트하세요.</p>
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

        {/* 주문 목록 테이블 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      주문번호
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      고객정보
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      단체명
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      상품
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      금액
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      상태
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      주문일시
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-500">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
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
                            <p className="font-mono font-bold text-sm">
                              {order.orderNumber}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-sm">
                              {order.customerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.customerPhone}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">
                              {order.shippingInfo.organizationName || "-"}
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm">
                              {order.items.length}종 / {totalQuantity}개
                            </p>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-sm">
                              {order.totalAmount.toLocaleString()}원
                            </p>
                          </td>
                          <td className="p-4">
                            <Badge
                              className={`${STATUS_COLORS[order.status]} border`}
                            >
                              <Icon className="w-3 h-3 mr-1" />
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString(
                                "ko-KR",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditOrder(order)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
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

      {/* 상세 보기 다이얼로그 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>주문 상세</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="info">주문 정보</TabsTrigger>
                <TabsTrigger value="items">상품 목록</TabsTrigger>
                <TabsTrigger value="design">디자인</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* 고객 정보 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">주문자 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">이름</span>
                      <span className="font-medium">
                        {selectedOrder.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.customerPhone}</span>
                    </div>
                    {selectedOrder.customerEmail && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-20">이메일</span>
                        <span>{selectedOrder.customerEmail}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 배송 정보 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">배송 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 w-20">수령인</span>
                      <span className="font-medium">
                        {selectedOrder.shippingInfo.recipientName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.shippingInfo.phone}</span>
                    </div>
                    {selectedOrder.shippingInfo.organizationName && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{selectedOrder.shippingInfo.organizationName}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span>
                        {selectedOrder.shippingInfo.zipCode && (
                          <span className="text-gray-500">
                            [{selectedOrder.shippingInfo.zipCode}]{" "}
                          </span>
                        )}
                        {selectedOrder.shippingInfo.address}
                        {selectedOrder.shippingInfo.addressDetail && (
                          <span> {selectedOrder.shippingInfo.addressDetail}</span>
                        )}
                      </span>
                    </div>
                    {selectedOrder.shippingInfo.memo && (
                      <div className="bg-yellow-50 p-2 rounded text-yellow-700">
                        메모: {selectedOrder.shippingInfo.memo}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 금액 정보 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">결제 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">상품 합계</span>
                      <span>{selectedOrder.subtotal.toLocaleString()}원</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">배송비</span>
                      <span>
                        {selectedOrder.shippingCost === 0
                          ? "무료"
                          : `${selectedOrder.shippingCost.toLocaleString()}원`}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>총 결제금액</span>
                      <span className="text-blue-600">
                        {selectedOrder.totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* 관리자 메모 */}
                {selectedOrder.adminMemo && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">관리자 메모</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm bg-gray-50 p-3 rounded">
                        {selectedOrder.adminMemo}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="items" className="mt-4">
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-500">
                              {item.colorLabel} / {item.size}
                            </p>
                            <p className="text-sm">
                              {item.unitPrice.toLocaleString()}원 × {item.quantity}
                              개
                            </p>
                          </div>
                          <p className="font-bold">
                            {item.totalPrice.toLocaleString()}원
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="design" className="mt-4">
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          {item.colorLabel} - {item.size}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {item.designSnapshot.length === 0 ? (
                          <p className="text-gray-500 text-sm">
                            디자인 없음
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {item.designSnapshot.map((layer) => (
                              <div
                                key={layer.id}
                                className="border rounded p-2"
                              >
                                {layer.type === "image" ? (
                                  <div className="aspect-square relative bg-gray-100 rounded overflow-hidden">
                                    <img
                                      src={layer.content}
                                      alt="Design"
                                      className="object-contain w-full h-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="aspect-square flex items-center justify-center bg-gray-100 rounded">
                                    <span className="text-sm">{layer.content}</span>
                                  </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  {layer.view}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>주문 수정</DialogTitle>
            <DialogDescription>
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 mt-4">
              {/* 상태 변경 */}
              <div className="space-y-2">
                <Label>주문 상태</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="상태 선택" />
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

              {/* 상태 변경 메모 */}
              {newStatus && newStatus !== selectedOrder.status && (
                <div className="space-y-2">
                  <Label>상태 변경 메모 (선택)</Label>
                  <Input
                    placeholder="고객에게 표시될 메모"
                    value={statusMemo}
                    onChange={(e) => setStatusMemo(e.target.value)}
                  />
                </div>
              )}

              <Separator />

              {/* 관리자 메모 */}
              <div className="space-y-2">
                <Label>관리자 메모</Label>
                <Textarea
                  placeholder="내부용 메모 (고객에게 표시되지 않음)"
                  value={adminMemo}
                  onChange={(e) => setAdminMemo(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpdateOrder}
                  disabled={updating}
                  className="flex-1"
                >
                  {updating ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
