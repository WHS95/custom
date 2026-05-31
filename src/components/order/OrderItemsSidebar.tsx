"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Eye,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { DesignLayer } from "@/components/shared/HatDesignCanvas";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  color: string;
  colorLabel: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  designSnapshot: DesignLayer[];
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingInfo: {
    recipientName: string;
    phone: string;
    address: string;
    addressDetail?: string;
    organizationName?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface OrderItemsSidebarProps {
  order: OrderDetail;
  editedLayers: Record<string, DesignLayer[]>;
  selectedItemIndex: number;
  expandedItems: Set<string>;
  onSelectItem: (index: number) => void;
  onToggleExpand: (itemId: string) => void;
}

const sidebarViewLabels: Record<string, string> = {
  front: "\uC55E\uBA74",
  back: "\uB4B7\uBA74",
  left: "\uC88C\uCE21",
  right: "\uC6B0\uCE21",
  top: "\uC0C1\uB2E8",
};

export default function OrderItemsSidebar({
  order,
  editedLayers,
  selectedItemIndex,
  expandedItems,
  onSelectItem,
  onToggleExpand,
}: OrderItemsSidebarProps) {
  return (
    <>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-base">커스텀 내역 확인</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          각 색상을 클릭하여 디자인 상세를 확인하세요
        </p>
        <div className="space-y-3">
          {order.items.map((item, index) => {
            const itemLayers =
              editedLayers[item.id] || item.designSnapshot || [];
            const hasDesign = itemLayers.length > 0;
            const isEdited = !!editedLayers[item.id];
            const isExpanded = expandedItems.has(item.id);
            const isSelected = selectedItemIndex === index;

            const layersByView = itemLayers.reduce(
              (acc, layer) => {
                if (!acc[layer.view]) acc[layer.view] = [];
                acc[layer.view].push(layer);
                return acc;
              },
              {} as Record<string, DesignLayer[]>,
            );

            return (
              <div
                key={item.id}
                className={`rounded-xl border-2 overflow-hidden transition-all ${
                  isSelected
                    ? "border-blue-500 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className={`p-3 cursor-pointer ${isSelected ? "bg-blue-50" : "bg-gray-50"}`}
                  onClick={() => onSelectItem(index)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {item.colorLabel}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        사이즈: {item.size} · 수량: {item.quantity}개
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {hasDesign && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                            {itemLayers.length}개 레이어
                          </span>
                        )}
                        {isEdited && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">
                            수정됨
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleExpand(item.id);
                      }}
                      className="p-1.5 hover:bg-white rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-3 pt-0 space-y-3">
                      <Separator />
                      {hasDesign ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-500">
                            디자인 위치:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(layersByView).map(
                              ([view, layers]) => (
                                <span
                                  key={view}
                                  className="text-xs bg-gray-100 px-2 py-1 rounded flex items-center gap-1"
                                >
                                  <span>{sidebarViewLabels[view] || view}</span>
                                  <span className="text-blue-600 font-medium">
                                    {layers.length}개
                                  </span>
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">
                          디자인이 없습니다
                        </p>
                      )}

                      <div className="bg-gray-50 rounded-lg p-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">단가</span>
                          <span>{item.unitPrice.toLocaleString()}원</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold mt-1">
                          <span>소계</span>
                          <span className="text-blue-600">
                            {item.totalPrice.toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className="w-full"
                        onClick={() => onSelectItem(index)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        {isSelected ? "현재 보는 중" : "캔버스에서 보기"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />
      <div className="p-4 space-y-3 text-sm">
        <div>
          <p className="text-gray-500">배송지</p>
          <p className="font-medium">{order.shippingInfo.recipientName}</p>
          <p className="text-gray-600 text-xs">
            {order.shippingInfo.address} {order.shippingInfo.addressDetail}
          </p>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">총 금액</span>
          <span className="font-bold">
            {order.totalAmount.toLocaleString()}원
          </span>
        </div>
      </div>

      {order.status === "delivered" && (
        <>
          <Separator />
          <div className="p-4">
            <Link href={`/gallery/write?order=${order.orderNumber}`}>
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                후기 작성하기
              </Button>
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center">
              상품에 대한 후기를 남겨주세요
            </p>
          </div>
        </>
      )}
    </>
  );
}
