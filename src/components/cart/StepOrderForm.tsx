"use client"

import { useState, useCallback } from "react"
import { StepIndicator, OrderStep } from "./StepIndicator"
import { AdminMessageStep } from "./steps/AdminMessageStep"
import { CustomerInfoStep } from "./steps/CustomerInfoStep"
import { ShippingInfoStep } from "./steps/ShippingInfoStep"
import { AttachmentStep } from "./steps/AttachmentStep"
import { ConfirmationStep } from "./steps/ConfirmationStep"

export interface OrderFormData {
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
}

interface AdminMessage {
  productId: string
  productName: string
  message: string
}

interface StepOrderFormProps {
  adminMessages: AdminMessage[]
  onSubmit: (formData: OrderFormData, attachmentFiles: File[]) => Promise<void>
  totalAmount: number
  isSubmitting: boolean
}

export function StepOrderForm({
  adminMessages,
  onSubmit,
  totalAmount,
  isSubmitting,
}: StepOrderFormProps) {
  const hasAdminMessage = adminMessages.length > 0

  // 단계 순서 정의 (파일 첨부 단계 추가)
  const stepOrder: OrderStep[] = hasAdminMessage
    ? ["adminConfirm", "customerInfo", "shippingInfo", "attachment", "confirmation"]
    : ["customerInfo", "shippingInfo", "attachment", "confirmation"]

  const initialStep: OrderStep = stepOrder[0]

  const [currentStep, setCurrentStep] = useState<OrderStep>(initialStep)
  const [adminConfirmed, setAdminConfirmed] = useState(false)
  const [formData, setFormData] = useState<OrderFormData>({
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
  
  // 첨부파일 상태
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])

  // 현재 단계 인덱스
  const currentStepIndex = stepOrder.indexOf(currentStep)

  // 다음 단계로 이동
  const goToStep = useCallback((step: OrderStep) => {
    setCurrentStep(step)
  }, [])

  // 이전 단계로 이동
  const goToPreviousStep = useCallback(() => {
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }, [currentStep, stepOrder])

  // 폼 필드 변경 핸들러
  const handleChange = useCallback(
    <K extends keyof OrderFormData>(field: K, value: OrderFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }))
    },
    []
  )

  // 주문 제출
  const handleSubmit = async () => {
    await onSubmit(formData, attachmentFiles)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Step Indicator - 고정 */}
      <div className="px-4 py-3 border-b bg-white flex-shrink-0">
        <StepIndicator currentStep={currentStep} hasAdminMessage={hasAdminMessage} />
      </div>

      {/* 슬라이드 컨테이너 */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(-${currentStepIndex * 100}%)`,
            transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* 관리자 메시지 확인 단계 */}
          {hasAdminMessage && (
            <div className="w-full flex-shrink-0 h-full overflow-y-auto">
              <div className="p-4">
                <AdminMessageStep
                  messages={adminMessages}
                  confirmed={adminConfirmed}
                  onConfirmChange={setAdminConfirmed}
                  onNext={() => goToStep("customerInfo")}
                  isActive={currentStep === "adminConfirm"}
                />
              </div>
            </div>
          )}

          {/* 주문자 정보 단계 */}
          <div className="w-full flex-shrink-0 h-full overflow-y-auto">
            <div className="p-4">
              <CustomerInfoStep
                formData={{
                  customerName: formData.customerName,
                  customerPhone: formData.customerPhone,
                  customerEmail: formData.customerEmail,
                }}
                onChange={handleChange}
                onNext={() => goToStep("shippingInfo")}
                onBack={hasAdminMessage ? goToPreviousStep : undefined}
                isActive={currentStep === "customerInfo"}
              />
            </div>
          </div>

          {/* 배송 정보 단계 */}
          <div className="w-full flex-shrink-0 h-full overflow-y-auto">
            <div className="p-4">
              <ShippingInfoStep
                formData={{
                  recipientName: formData.recipientName,
                  recipientPhone: formData.recipientPhone,
                  zipCode: formData.zipCode,
                  address: formData.address,
                  addressDetail: formData.addressDetail,
                  organizationName: formData.organizationName,
                  memo: formData.memo,
                }}
                customerInfo={{
                  customerName: formData.customerName,
                  customerPhone: formData.customerPhone,
                }}
                onChange={handleChange}
                onNext={() => goToStep("attachment")}
                onBack={goToPreviousStep}
                isActive={currentStep === "shippingInfo"}
              />
            </div>
          </div>

          {/* 파일 첨부 단계 */}
          <div className="w-full flex-shrink-0 h-full overflow-y-auto">
            <div className="p-4">
              <AttachmentStep
                files={attachmentFiles}
                onFilesChange={setAttachmentFiles}
                onNext={() => goToStep("confirmation")}
                onBack={goToPreviousStep}
                isActive={currentStep === "attachment"}
              />
            </div>
          </div>

          {/* 주문 확인 단계 */}
          <div className="w-full flex-shrink-0 h-full overflow-y-auto">
            <div className="p-4">
              <ConfirmationStep
                totalAmount={totalAmount}
                isActive={currentStep === "confirmation"}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onBack={goToPreviousStep}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
