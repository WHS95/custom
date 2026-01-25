"use client"

import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface AdminMessage {
  productId: string
  productName: string
  message: string
}

interface AdminMessageStepProps {
  messages: AdminMessage[]
  confirmed: boolean
  onConfirmChange: (confirmed: boolean) => void
  onNext: () => void
  isActive: boolean
}

export function AdminMessageStep({
  messages,
  confirmed,
  onConfirmChange,
  onNext,
  isActive,
}: AdminMessageStepProps) {
  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="h-5 w-5" />
          주문 전 확인사항
        </CardTitle>
        <p className="text-sm text-orange-700">
          아래 내용을 반드시 확인해주세요
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.map((msg) => (
          <div key={msg.productId} className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
            <h4 className="font-medium text-sm text-gray-700 mb-2">{msg.productName}</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{msg.message}</p>
          </div>
        ))}

        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-orange-100/50 transition-colors">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-orange-300 text-orange-600 focus:ring-orange-500"
          />
          <span className="text-sm font-medium text-gray-700">위 내용을 확인했습니다</span>
        </label>

        <Button onClick={onNext} disabled={!confirmed} className="w-full">
          다음 단계로
        </Button>
      </CardContent>
    </Card>
  )
}
