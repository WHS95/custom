"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StepOrderForm, OrderFormData } from "./StepOrderForm"

interface AdminMessage {
  productId: string
  productName: string
  message: string
}

interface OrderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminMessages: AdminMessage[]
  totalAmount: number
  onSubmit: (formData: OrderFormData, attachmentFiles: File[]) => Promise<void>
  isSubmitting: boolean
}

export function OrderModal({
  open,
  onOpenChange,
  adminMessages,
  totalAmount,
  onSubmit,
  isSubmitting,
}: OrderModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white z-10 flex-shrink-0">
          <DialogTitle className="text-xl font-bold">주문하기</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <StepOrderForm
            adminMessages={adminMessages}
            totalAmount={totalAmount}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
