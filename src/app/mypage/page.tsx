"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Package,
  User,
  ChevronRight,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle,
  Users,
} from "lucide-react";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/domain/order";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
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

export default function MyPage() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // 주문 내역 불러오기
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        const response = await fetch(`/api/orders?userId=${user.id}`);
        const data = await response.json();

        if (data.success) {
          setOrders(data.orders);
        }
      } catch (error) {
        console.error("주문 조회 에러:", error);
      } finally {
        setIsLoadingOrders(false);
      }
    }

    if (!authLoading && user) {
      fetchOrders();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">로그인이 필요합니다</p>
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
        </div>
      </div>
    );
  }

  // 주문 상태별 카운트
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    inProgress: orders.filter((o) =>
      ["design_confirmed", "preparing", "in_production"].includes(o.status)
    ).length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 프로필 헤더 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{profile.name}</h1>
                  <p className="text-gray-500">{user.email}</p>
                  {profile.user_type === "crew_staff" && profile.crew_name && (
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-600 font-medium">
                        {profile.crew_name} 운영진
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/mypage/profile">
                  <Button variant="outline" size="sm">
                    프로필 관리
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  로그아웃
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 주문 현황 요약 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              주문 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-yellow-600">
                  {orderStats.pending}
                </p>
                <p className="text-xs text-gray-500">주문 접수</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <Package className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-600">
                  {orderStats.inProgress}
                </p>
                <p className="text-xs text-gray-500">제작 중</p>
              </div>
              <div className="p-4 bg-cyan-50 rounded-lg">
                <Truck className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
                <p className="text-2xl font-bold text-cyan-600">
                  {orderStats.shipped}
                </p>
                <p className="text-xs text-gray-500">배송 중</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-600">
                  {orderStats.delivered}
                </p>
                <p className="text-xs text-gray-500">배송 완료</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 최근 주문 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">최근 주문</CardTitle>
            {orders.length > 0 && (
              <Link href="/mypage/orders">
                <Button variant="ghost" size="sm">
                  전체 보기
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingOrders ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">아직 주문 내역이 없습니다</p>
                <Link href="/">
                  <Button>쇼핑하러 가기</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/order/${order.orderNumber}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-medium">{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString("ko-KR")}{" "}
                          · {order.itemCount}개 상품
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={STATUS_COLORS[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                        <span className="font-medium">
                          {order.totalAmount.toLocaleString()}원
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
