"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/store/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
} from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const getShippingCost = useCartStore((state) => state.getShippingCost)
  const getGrandTotal = useCartStore((state) => state.getGrandTotal)
  const clearCart = useCartStore((state) => state.clearCart)

  const [isOrdering, setIsOrdering] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)

  // 주문 폼 상태
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    recipientName: "",
    recipientPhone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    organizationName: "",
    memo: "",
  })

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      updateItemQuantity(id, item.quantity + delta)
    }
  }

  const handleOrder = async () => {
    // 유효성 검사
    if (!orderForm.customerName || !orderForm.customerPhone) {
      toast.error("주문자 정보를 입력해주세요")
      return
    }
    if (!orderForm.recipientName || !orderForm.recipientPhone || !orderForm.address) {
      toast.error("배송지 정보를 입력해주세요")
      return
    }

    setIsOrdering(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          customerEmail: orderForm.customerEmail || undefined,
          shippingInfo: {
            recipientName: orderForm.recipientName,
            phone: orderForm.recipientPhone,
            zipCode: orderForm.zipCode,
            address: orderForm.address,
            addressDetail: orderForm.addressDetail,
            organizationName: orderForm.organizationName || undefined,
            memo: orderForm.memo || undefined,
          },
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            color: item.color,
            colorLabel: item.colorLabel,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            designLayers: item.designLayers,
          })),
        }),
      })

      const data = await response.json()

      if (data.success) {
        clearCart()
        toast.success("주문이 완료되었습니다!")
        router.push(`/order/${data.order.orderNumber}`)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("주문 에러:", error)
      toast.error("주문 처리 중 오류가 발생했습니다")
    } finally {
      setIsOrdering(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-2">
            장바구니가 비어있습니다
          </h1>
          <p className="text-gray-500 mb-6">
            상품을 추가하고 커스텀해보세요!
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              상품 둘러보기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">장바구니</h1>
            <p className="text-sm text-gray-500">
              {items.length}개 상품
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 장바구니 아이템 목록 */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* 디자인 미리보기 */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.designLayers.length > 0 ? (
                        <div className="w-full h-full relative">
                          {item.designLayers
                            .filter((l) => l.view === "front")
                            .slice(0, 1)
                            .map((layer) => (
                              <img
                                key={layer.id}
                                src={layer.content}
                                alt="Design"
                                className="w-full h-full object-contain"
                              />
                            ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🧢
                        </div>
                      )}
                    </div>

                    {/* 상품 정보 */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{item.productName}</h3>
                          <p className="text-sm text-gray-500">
                            {item.colorLabel} / {item.size}
                          </p>
                          <p className="text-sm text-gray-500">
                            디자인: {item.designLayers.length}개 레이어
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        {/* 수량 조절 */}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuantityChange(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* 가격 */}
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {item.unitPrice.toLocaleString()}원 x {item.quantity}
                          </p>
                          <p className="font-bold text-lg">
                            {(item.unitPrice * item.quantity).toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 주문 요약 */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>상품 합계</span>
                  <span>{getTotalPrice().toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>배송비</span>
                  <span>
                    {getShippingCost() === 0
                      ? "무료"
                      : `${getShippingCost().toLocaleString()}원`}
                  </span>
                </div>
                {getShippingCost() > 0 && (
                  <p className="text-xs text-gray-500">
                    {(50000 - getTotalPrice()).toLocaleString()}원 추가 시 무료배송
                  </p>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>총 결제금액</span>
                  <span className="text-blue-600">
                    {getGrandTotal().toLocaleString()}원
                  </span>
                </div>

                {!showOrderForm ? (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setShowOrderForm(true)}
                  >
                    주문하기
                  </Button>
                ) : null}
              </CardContent>
            </Card>

            {/* 주문 폼 */}
            {showOrderForm && (
              <Card>
                <CardHeader>
                  <CardTitle>배송 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 주문자 정보 */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-700">주문자 정보</h4>
                    <div className="space-y-2">
                      <Label>이름 *</Label>
                      <Input
                        value={orderForm.customerName}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, customerName: e.target.value })
                        }
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>연락처 *</Label>
                      <Input
                        value={orderForm.customerPhone}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, customerPhone: e.target.value })
                        }
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>이메일</Label>
                      <Input
                        type="email"
                        value={orderForm.customerEmail}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, customerEmail: e.target.value })
                        }
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* 배송지 정보 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-sm text-gray-700">배송지 정보</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setOrderForm({
                            ...orderForm,
                            recipientName: orderForm.customerName,
                            recipientPhone: orderForm.customerPhone,
                          })
                        }
                      >
                        주문자와 동일
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>수령인 *</Label>
                      <Input
                        value={orderForm.recipientName}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, recipientName: e.target.value })
                        }
                        placeholder="홍길동"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>연락처 *</Label>
                      <Input
                        value={orderForm.recipientPhone}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, recipientPhone: e.target.value })
                        }
                        placeholder="010-0000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>단체명 (선택)</Label>
                      <Input
                        value={orderForm.organizationName}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, organizationName: e.target.value })
                        }
                        placeholder="회사/동아리/팀 이름"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>우편번호</Label>
                      <Input
                        value={orderForm.zipCode}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, zipCode: e.target.value })
                        }
                        placeholder="12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>주소 *</Label>
                      <Input
                        value={orderForm.address}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, address: e.target.value })
                        }
                        placeholder="서울시 강남구 테헤란로 123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>상세주소</Label>
                      <Input
                        value={orderForm.addressDetail}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, addressDetail: e.target.value })
                        }
                        placeholder="아파트 동/호수"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>배송 메모</Label>
                      <Textarea
                        value={orderForm.memo}
                        onChange={(e) =>
                          setOrderForm({ ...orderForm, memo: e.target.value })
                        }
                        placeholder="배송 시 요청사항"
                        rows={2}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleOrder}
                    disabled={isOrdering}
                  >
                    {isOrdering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        주문 처리 중...
                      </>
                    ) : (
                      `${getGrandTotal().toLocaleString()}원 결제하기`
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
