"use client"

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Package,
  Truck,
  User,
  Phone,
  MapPin,
  Building,
  CheckCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useCartStore, CartItem } from '@/lib/store/cart-store'
import { useDesignStore } from '@/lib/store/design-store'
import { toast } from 'sonner'
import type { ShippingInfo, CreateOrderItemDTO } from '@/domain/order'

interface OrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'form' | 'confirming' | 'success' | 'error'

interface OrderFormData {
  customerName: string
  customerPhone: string
  customerEmail: string
  recipientName: string
  recipientPhone: string
  zipCode: string
  address: string
  addressDetail: string
  organizationName: string
  memo: string
  sameAsCustomer: boolean
}

export function OrderDialog({ open, onOpenChange }: OrderDialogProps) {
  const cartItems = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const getShippingCost = useCartStore((state) => state.getShippingCost)
  const getGrandTotal = useCartStore((state) => state.getGrandTotal)
  const clearCart = useCartStore((state) => state.clearCart)
  const newSession = useDesignStore((state) => state.newSession)

  const [step, setStep] = useState<Step>('form')
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    recipientName: '',
    recipientPhone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
    organizationName: '',
    memo: '',
    sameAsCustomer: true,
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'customerName' && prev.sameAsCustomer
        ? { recipientName: value }
        : {}),
      ...(name === 'customerPhone' && prev.sameAsCustomer
        ? { recipientPhone: value }
        : {}),
    }))
  }

  const handleSameAsCustomerChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      sameAsCustomer: checked,
      recipientName: checked ? prev.customerName : '',
      recipientPhone: checked ? prev.customerPhone : '',
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.customerName.trim()) return '주문자명을 입력해주세요.'
    if (!formData.customerPhone.trim()) return '주문자 연락처를 입력해주세요.'
    if (!formData.recipientName.trim()) return '수령인명을 입력해주세요.'
    if (!formData.recipientPhone.trim()) return '수령인 연락처를 입력해주세요.'
    if (!formData.address.trim()) return '주소를 입력해주세요.'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setStep('confirming')

    try {
      const shippingInfo: ShippingInfo = {
        recipientName: formData.recipientName,
        phone: formData.recipientPhone,
        zipCode: formData.zipCode,
        address: formData.address,
        addressDetail: formData.addressDetail,
        organizationName: formData.organizationName || undefined,
        memo: formData.memo || undefined,
      }

      const items: CreateOrderItemDTO[] = cartItems.map((item: CartItem) => ({
        productId: item.productId,
        productName: item.productName,
        color: item.color,
        colorLabel: item.colorLabel,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        designLayers: item.designLayers.map((layer) => ({
          id: layer.id,
          type: layer.type,
          content: layer.content,
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          rotation: layer.rotation,
          flipX: layer.flipX,
          flipY: layer.flipY,
          view: layer.view,
          color: layer.color,
        })),
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || undefined,
          shippingInfo,
          items,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '주문 생성에 실패했습니다.')
      }

      setOrderNumber(data.order.orderNumber)
      setStep('success')

      // 장바구니 비우기 및 새 세션 시작
      clearCart()
      newSession()

      toast.success('주문이 완료되었습니다!', {
        description: `주문번호: ${data.order.orderNumber}`,
      })
    } catch (error) {
      console.error('주문 에러:', error)
      setErrorMessage(error instanceof Error ? error.message : '주문 처리 중 오류가 발생했습니다.')
      setStep('error')
    }
  }

  const handleClose = () => {
    if (step === 'confirming') return // 처리 중에는 닫기 방지
    setStep('form')
    setOrderNumber('')
    setErrorMessage('')
    onOpenChange(false)
  }

  const totalPrice = getTotalPrice()
  const shippingCost = getShippingCost()
  const grandTotal = getGrandTotal()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {step === 'success' ? '주문 완료' : '주문하기'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form' && '배송 정보를 입력해주세요.'}
            {step === 'confirming' && '주문을 처리하고 있습니다...'}
            {step === 'success' && '주문이 성공적으로 접수되었습니다.'}
            {step === 'error' && '주문 처리 중 문제가 발생했습니다.'}
          </DialogDescription>
        </DialogHeader>

        {/* 폼 단계 */}
        {step === 'form' && (
          <div className="space-y-6 py-4">
            {/* 주문자 정보 */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <User className="w-4 h-4" />
                주문자 정보
              </h3>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="customerName">주문자명 *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customerPhone">연락처 *</Label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="customerEmail">이메일 (선택)</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="email@example.com"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 배송 정보 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4" />
                  배송 정보
                </h3>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sameAsCustomer}
                    onChange={(e) => handleSameAsCustomerChange(e.target.checked)}
                    className="rounded"
                  />
                  주문자 정보와 동일
                </label>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="recipientName">수령인명 *</Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      value={formData.recipientName}
                      onChange={handleInputChange}
                      placeholder="홍길동"
                      disabled={formData.sameAsCustomer}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recipientPhone">연락처 *</Label>
                    <Input
                      id="recipientPhone"
                      name="recipientPhone"
                      value={formData.recipientPhone}
                      onChange={handleInputChange}
                      placeholder="010-1234-5678"
                      disabled={formData.sameAsCustomer}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="organizationName" className="flex items-center gap-1">
                    <Building className="w-3 h-3" />
                    단체명 (선택)
                  </Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="런하우스"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">우편번호</Label>
                    <Input
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      placeholder="12345"
                    />
                  </div>
                  <div className="col-span-2 grid gap-2">
                    <Label htmlFor="address" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      주소 *
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="서울시 강남구 테헤란로 123"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="addressDetail">상세주소</Label>
                  <Input
                    id="addressDetail"
                    name="addressDetail"
                    value={formData.addressDetail}
                    onChange={handleInputChange}
                    placeholder="456호"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="memo">배송 메모</Label>
                  <Textarea
                    id="memo"
                    name="memo"
                    value={formData.memo}
                    onChange={handleInputChange}
                    placeholder="부재시 경비실에 맡겨주세요"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 주문 요약 */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-sm">주문 요약</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">상품 ({cartItems.length}종)</span>
                  <span>{totalPrice.toLocaleString()} KRW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">배송비</span>
                  <span>{shippingCost === 0 ? '무료' : `${shippingCost.toLocaleString()} KRW`}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>총 결제금액</span>
                  <span className="text-blue-600">{grandTotal.toLocaleString()} KRW</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSubmit} className="w-full h-12 text-base">
              주문 접수하기
            </Button>
          </div>
        )}

        {/* 처리 중 */}
        {step === 'confirming' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-gray-600">주문을 처리하고 있습니다...</p>
            <p className="text-sm text-gray-400">잠시만 기다려주세요.</p>
          </div>
        )}

        {/* 성공 */}
        {step === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">주문이 완료되었습니다!</h3>
              <p className="text-gray-600">
                주문번호: <span className="font-mono font-bold text-blue-600">{orderNumber}</span>
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg w-full text-sm text-gray-600 space-y-2">
              <p>• 주문 내역은 주문번호 또는 전화번호로 확인할 수 있습니다.</p>
              <p>• 디자인 확정 후 제작이 진행됩니다.</p>
              <p>• 문의사항은 고객센터로 연락해주세요.</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => window.location.href = `/dashboard?phone=${formData.customerPhone}`}
                className="flex-1"
              >
                주문 조회하기
              </Button>
              <Button onClick={handleClose} className="flex-1">
                확인
              </Button>
            </div>
          </div>
        )}

        {/* 에러 */}
        {step === 'error' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-red-600">주문 처리 실패</h3>
              <p className="text-gray-600">{errorMessage}</p>
            </div>
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                취소
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                다시 시도
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
