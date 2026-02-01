"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Package,
  ArrowLeft,
  ChevronRight,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/domain/order";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
  items?: {
    productName: string;
    colorLabel: string;
    size: string;
    quantity: number;
  }[];
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  design_confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-purple-100 text-purple-700",
  in_production: "bg-orange-100 text-orange-700",
  shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-700",
};

type FilterTab = "all" | "active" | "completed";

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  // 주문 내역 불러오기
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        const response = await fetch(`/api/orders?userId=${user.id}&detail=true`);
        const data = await response.json();

        if (data.success) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error("주문 조회 에러:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  // 필터링된 주문
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "active") {
      return !["delivered", "cancelled"].includes(order.status);
    }
    if (filter === "completed") {
      return ["delivered", "cancelled"].includes(order.status);
    }
    return true;
  });

  // 날짜별 그룹화
  const groupedOrders = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(order);
    return acc;
  }, {} as Record<string, OrderSummary[]>);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold">주문 내역</h1>
          <p className="text-gray-500 mt-1">총 {orders.length}건의 주문</p>
        </div>

        {/* 필터 탭 */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="active">진행 중</TabsTrigger>
            <TabsTrigger value="completed">완료</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 주문 목록 */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {filter === "all"
                  ? "주문 내역이 없습니다"
                  : filter === "active"
                  ? "진행 중인 주문이 없습니다"
                  : "완료된 주문이 없습니다"}
              </p>
              <Link href="/">
                <Button>쇼핑하러 가기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedOrders).map(([date, dateOrders]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-medium text-gray-600">{date}</h2>
                </div>
                <div className="space-y-3">
                  {dateOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/order/${order.orderNumber}`}
                      className="block"
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium">{order.orderNumber}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString(
                                  "ko-KR",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </p>
                            </div>
                            <Badge className={STATUS_COLORS[order.status]}>
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </div>

                          {/* 주문 아이템 요약 */}
                          {order.items && order.items.length > 0 && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <ShoppingBag className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {order.itemCount}개 상품
                                </span>
                              </div>
                              <div className="space-y-1">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <p key={idx} className="text-sm text-gray-700">
                                    {item.productName} - {item.colorLabel} / {item.size}{" "}
                                    x {item.quantity}
                                  </p>
                                ))}
                                {order.items.length > 2 && (
                                  <p className="text-sm text-gray-500">
                                    외 {order.items.length - 2}개 상품
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              {order.totalAmount.toLocaleString()}원
                            </span>
                            <div className="flex items-center text-sm text-blue-600">
                              상세 보기
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
