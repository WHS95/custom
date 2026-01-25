"use client"

import { User, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PhoneInput } from "@/components/ui/phone-input"
import { EmailInput } from "@/components/ui/email-input"

interface CustomerInfoData {
  customerName: string
  customerPhone: string
  customerEmail: string
}

interface CustomerInfoStepProps {
  formData: CustomerInfoData
  onChange: (field: keyof CustomerInfoData, value: string) => void
  onNext: () => void
  onBack?: () => void
  isActive: boolean
}

export function CustomerInfoStep({
  formData,
  onChange,
  onNext,
  onBack,
  isActive,
}: CustomerInfoStepProps) {
  const isValid = formData.customerName.trim() && formData.customerPhone.trim()

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          주문자 정보
        </CardTitle>
        <p className="text-sm text-gray-500">
          주문자 정보를 입력해주세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">
            이름 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) => onChange("customerName", e.target.value)}
            placeholder="홍길동"
            autoFocus={isActive}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerPhone">
            연락처 <span className="text-red-500">*</span>
          </Label>
          <PhoneInput
            value={formData.customerPhone}
            onChange={(value) => onChange("customerPhone", value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">이메일 (선택)</Label>
          <EmailInput
            value={formData.customerEmail}
            onChange={(value) => onChange("customerEmail", value)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-1" />
              이전
            </Button>
          )}
          <Button onClick={onNext} disabled={!isValid} className="flex-1">
            다음 단계로
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
