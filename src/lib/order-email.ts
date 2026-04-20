interface OrderEmailPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  organizationName?: string;
  totalAmount: number;
  itemCount: number;
}

const ORDER_NOTIFY_FUNCTION_URL = process.env.SUPABASE_ORDER_NOTIFY_FUNCTION_URL;
const ORDER_NOTIFY_SECRET = process.env.ORDER_NOTIFY_FUNCTION_SECRET;

export async function notifyNewOrderByEmail(payload: OrderEmailPayload) {
  if (!ORDER_NOTIFY_FUNCTION_URL) {
    console.warn(
      "[OrderEmail] SUPABASE_ORDER_NOTIFY_FUNCTION_URL 환경변수가 설정되지 않았습니다.",
    );
    return false;
  }

  if (!ORDER_NOTIFY_SECRET) {
    console.warn(
      "[OrderEmail] ORDER_NOTIFY_FUNCTION_SECRET 환경변수가 설정되지 않았습니다.",
    );
    return false;
  }

  try {
    const response = await fetch(ORDER_NOTIFY_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-order-notify-secret": ORDER_NOTIFY_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[OrderEmail] Edge Function 호출 실패:", response.status, body);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[OrderEmail] 주문 메일 발송 실패:", error);
    return false;
  }
}
