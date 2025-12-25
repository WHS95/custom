"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Phone,
  ArrowRight,
  Palette,
  Factory,
  PackageCheck,
  ZoomIn,
} from "lucide-react"
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_ORDER,
  calculateOrderProgress,
  type OrderStatus,
} from "@/domain/order"
import { DesignPreview } from "@/components/order/DesignPreview"

interface DesignLayer {
  id: string
  type: "image" | "text"
  content: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
  flipX: boolean
  flipY: boolean
  view: "front" | "back" | "left" | "right" | "top"
  color?: string
}

interface OrderSummary {
  id: string
  orderNumber: string
  status: OrderStatus
  statusLabel: string
  totalAmount: number
  itemCount: number
  createdAt: string
}

interface OrderItem {
  id: string
  productName: string
  color: string
  colorLabel: string
  size: string
  quantity: number
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
    addressDetail: string
    organizationName?: string
  }
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  totalAmount: number
  status: OrderStatus
  statusLabel: string
  statusHistory: {
    toStatus: OrderStatus
    toStatusLabel: string
    changedBy: string
    memo?: string
    createdAt: string
  }[]
  createdAt: string
}

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  pending: Clock,
  design_confirmed: Palette,
  preparing: Factory,
  in_production: Factory,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: Package,
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

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialPhone = searchParams.get("phone") || ""

  const [phone, setPhone] = useState(initialPhone)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (initialPhone) {
      handleSearch()
    }
  }, [])

  const handleSearch = async () => {
    if (!phone.trim()) return

    setLoading(true)
    setSearched(true)

    try {
      const response = await fetch(`/api/orders?phone=${encodeURIComponent(phone)}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.orders)
      } else {
        setOrders([])
      }
    } catch (error) {
      console.error("주문 조회 에러:", error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleOrderClick = (orderNumber: string) => {
    // 주문 상세 페이지로 이동 (스튜디오 뷰)
    router.push(`/order/${orderNumber}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">주문 조회</h1>
          <p className="text-gray-600">전화번호로 주문 내역을 확인하세요.</p>
        </div>

        {/* 검색 폼 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="tel"
                  placeholder="전화번호를 입력하세요 (예: 010-1234-5678)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? "조회 중..." : "조회"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 검색 결과 */}
        {searched && orders.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">주문 내역이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-1">
                전화번호를 다시 확인해주세요.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 주문 목록 */}
        {orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">
              총 {orders.length}건의 주문
            </h2>
            {orders.map((order) => {
              const Icon = STATUS_ICONS[order.status]
              const progress = calculateOrderProgress(order.status)

              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:border-blue-300 transition-colors"
                  onClick={() => handleOrderClick(order.orderNumber)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-mono font-bold text-lg">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[order.status]}>
                        <Icon className="w-3 h-3 mr-1" />
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>

                    {/* 진행률 바 */}
                    {order.status !== "cancelled" && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>진행률</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {order.itemCount}개 상품
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">
                          {order.totalAmount.toLocaleString()}원
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
