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
  pending: "bg-soft-cloud text-ink",
  design_confirmed: "bg-info/10 text-info",
  preparing: "bg-soft-cloud text-ink",
  in_production: "bg-soft-cloud text-ink",
  shipped: "bg-info/10 text-info",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-soft-cloud text-mute",
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
    router.push(`/order/${orderNumber}`)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-ink mb-2">주문 조회</h1>
          <p className="text-mute">전화번호로 주문 내역을 확인하세요.</p>
        </div>

        {/* 검색 폼 */}
        <Card className="mb-6 border border-hairline">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
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
          <Card className="text-center py-12 border border-hairline">
            <CardContent>
              <Package className="w-12 h-12 mx-auto text-hairline mb-4" />
              <p className="text-mute">주문 내역이 없습니다.</p>
              <p className="text-sm text-stone mt-1">
                전화번호를 다시 확인해주세요.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 주문 목록 */}
        {orders.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-ink">
              총 {orders.length}건의 주문
            </h2>
            {orders.map((order) => {
              const Icon = STATUS_ICONS[order.status]
              const progress = calculateOrderProgress(order.status)

              return (
                <Card
                  key={order.id}
                  className="cursor-pointer border border-hairline hover:border-ink/30 transition-colors"
                  onClick={() => handleOrderClick(order.orderNumber)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-mono font-bold text-lg text-ink">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-mute">
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
                        <div className="flex justify-between text-xs text-mute mb-1">
                          <span>진행률</span>
                          <span className="font-mono">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-soft-cloud rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ink transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-mute">
                        {order.itemCount}개 상품
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">
                          {order.totalAmount.toLocaleString()}원
                        </span>
                        <ArrowRight className="w-4 h-4 text-mute" />
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-mute">로딩 중...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
