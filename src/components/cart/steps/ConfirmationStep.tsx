"use client"

import { CheckCircle, Loader2, ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ConfirmationStepProps {
  totalAmount: number
  isActive: boolean
  isSubmitting: boolean
  onSubmit: () => void
  onBack: () => void
}

export function ConfirmationStep({
  totalAmount,
  isActive,
  isSubmitting,
  onSubmit,
  onBack,
}: ConfirmationStepProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          주문 확인
        </CardTitle>
        <p className="text-sm text-gray-500">
          최종 주문 정보를 확인해주세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <p className="text-sm text-gray-600 mb-2">총 결제 금액</p>
          <div className="text-3xl font-bold text-blue-600">
            {totalAmount.toLocaleString()}원
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 space-y-2">
          <p>• 주문 확인 후 카카오톡으로 안내드립니다</p>
          <p>• 커스텀 제작 상품은 주문 후 취소가 어려울 수 있습니다</p>
          <p>• 배송은 결제 완료 후 7-10일 소요됩니다</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex-1 h-12 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                주문 처리 중...
              </>
            ) : (
              "주문하기"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
