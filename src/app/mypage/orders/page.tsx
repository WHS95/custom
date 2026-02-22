import { redirect } from "next/navigation";
import { getCurrentUser } from "@/infrastructure/supabase/server";
import { getOrdersByUserId } from "@/application/order-service";
import {
  OrdersPageClient,
  type OrderSummary,
} from "@/components/mypage/OrdersPageClient";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?redirect=/mypage/orders");
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
      items: order.items.map((item) => ({
        productName: item.productName,
        colorLabel: item.colorLabel,
        size: item.size,
        quantity: item.quantity,
      })),
    }));
  } catch (error) {
    console.error("주문 조회 에러:", error);
  }

  return <OrdersPageClient orders={orders} />;
}
