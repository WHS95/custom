"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Unlock, CreditCard, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/domain/order";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  design_confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  in_production: "bg-orange-100 text-orange-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700",
};

export interface OrderHeaderProps {
  orderNumber: string;
  customerName: string;
  organizationName?: string;
  status: OrderStatus;
  canEdit: boolean;
  paymentLink?: string | null;
  paymentStatus?: string | null;
}

export default function OrderHeader({
  orderNumber,
  customerName,
  organizationName,
  status,
  canEdit,
  paymentLink,
  paymentStatus,
}: OrderHeaderProps) {
  const router = useRouter();

  return (
    <div className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              돌아가기
            </Button>
            <div>
              <h1 className="font-bold text-sm sm:text-lg">{orderNumber}</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {customerName} ·{" "}
                {organizationName || "개인"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {paymentStatus === "paid" ? (
              <Badge className="bg-green-100 text-green-700 text-xs sm:text-sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                결제 완료
              </Badge>
            ) : paymentLink ? (
              <Button size="sm" asChild>
                <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="w-4 h-4 mr-1" />
                  결제하기
                </a>
              </Button>
            ) : null}
            <Badge className={`text-xs sm:text-sm ${STATUS_COLORS[status]}`}>
              {ORDER_STATUS_LABELS[status]}
            </Badge>
            <Badge variant="outline" className={`hidden sm:inline-flex ${canEdit ? "text-green-600 border-green-300" : "text-gray-500"}`}>
              {canEdit ? (
                <><Unlock className="w-3 h-3 mr-1" />수정 가능</>
              ) : (
                <><Lock className="w-3 h-3 mr-1" />수정 불가</>
              )}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
