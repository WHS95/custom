"use client"

import { Truck, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/ui/phone-input"

interface ShippingInfoData {
  recipientName: string
  recipientPhone: string
  zipCode: string
  address: string
  addressDetail: string
  organizationName: string
  memo: string
}

interface CustomerInfoData {
  customerName: string
  customerPhone: string
}

interface ShippingInfoStepProps {
  formData: ShippingInfoData
  customerInfo: CustomerInfoData
  onChange: (field: keyof ShippingInfoData, value: string) => void
  onNext: () => void
  onBack: () => void
  isActive: boolean
}

export function ShippingInfoStep({
  formData,
  customerInfo,
  onChange,
  onNext,
  onBack,
  isActive,
}: ShippingInfoStepProps) {
  const isValid =
    formData.recipientName.trim() && formData.recipientPhone.trim() && formData.address.trim()

  // 주문자와 동일 버튼 핸들러
  const handleSameAsCustomer = () => {
    onChange("recipientName", customerInfo.customerName)
    onChange("recipientPhone", customerInfo.customerPhone)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          배송 정보
        </CardTitle>
        <p className="text-sm text-gray-500">
          배송받으실 정보를 입력해주세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleSameAsCustomer}>
            주문자와 동일
          </Button>
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientName">
            수령인 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="recipientName"
            value={formData.recipientName}
            onChange={(e) => onChange("recipientName", e.target.value)}
            placeholder="홍길동"
            autoFocus={isActive}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipientPhone">
            연락처 <span className="text-red-500">*</span>
          </Label>
          <PhoneInput
            value={formData.recipientPhone}
            onChange={(value) => onChange("recipientPhone", value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zipCode">우편번호</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => onChange("zipCode", e.target.value)}
            placeholder="12345"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">
            주소 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="서울시 강남구 테헤란로 123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressDetail">상세주소</Label>
          <Input
            id="addressDetail"
            value={formData.addressDetail}
            onChange={(e) => onChange("addressDetail", e.target.value)}
            placeholder="101동 1001호"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">단체명 (선택)</Label>
          <Input
            id="organizationName"
            value={formData.organizationName}
            onChange={(e) => onChange("organizationName", e.target.value)}
            placeholder="회사명 또는 단체명"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="memo">배송 메모</Label>
          <Textarea
            id="memo"
            value={formData.memo}
            onChange={(e) => onChange("memo", e.target.value)}
            placeholder="배송 시 요청사항을 입력해주세요"
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          <Button onClick={onNext} disabled={!isValid} className="flex-1">
            다음 단계로
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
