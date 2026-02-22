import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getCurrentUserProfile,
} from "@/infrastructure/supabase/server";
import { getOrdersByUserId } from "@/application/order-service";
import { MyPageClient } from "@/components/mypage/MyPageClient";
import type { OrderStatus } from "@/domain/order/types";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export default async function MyPage() {
  const [user, profile] = await Promise.all([
    getCurrentUser(),
    getCurrentUserProfile(),
  ]);

  if (!user) {
    redirect("/login?redirect=/mypage");
  }

  if (!profile) {
    redirect("/login?redirect=/mypage");
  }

  let orders: OrderSummary[] = [];
  try {
    const orderEntities = await getOrdersByUserId(user.id);
    orders = orderEntities.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      itemCount: order.items.length,
      createdAt:
        order.createdAt instanceof Date
          ? order.createdAt.toISOString()
          : String(order.createdAt),
    }));
  } catch (error) {
    console.error("주문 조회 에러:", error);
  }

  return (
    <MyPageClient
      profile={{
        name: String(profile.name ?? ""),
        user_type: (profile.user_type ?? "individual") as
          | "individual"
          | "crew_staff",
        crew_name: profile.crew_name as string | null | undefined,
      }}
      email={user.email}
      orders={orders}
    />
  );
}
