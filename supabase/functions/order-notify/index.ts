const resendApiKey = Deno.env.get("RESEND_API_KEY");
const notifyToEmail = Deno.env.get("ORDER_NOTIFY_TO_EMAIL");
const notifyFromEmail = Deno.env.get("ORDER_NOTIFY_FROM_EMAIL");
const notifySecret = Deno.env.get("ORDER_NOTIFY_FUNCTION_SECRET");

interface OrderNotifyPayload {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  organizationName?: string;
  totalAmount: number;
  itemCount: number;
}

function buildHtml(payload: OrderNotifyPayload) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;color:#111827;">
      <h2 style="margin:0 0 16px;">신규 주문이 접수되었습니다</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#6b7280;">주문번호</td><td style="padding:8px 0;font-weight:600;">${payload.orderNumber}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">주문자</td><td style="padding:8px 0;">${payload.customerName}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">연락처</td><td style="padding:8px 0;">${payload.customerPhone}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">이메일</td><td style="padding:8px 0;">${payload.customerEmail ?? "-"}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">단체명</td><td style="padding:8px 0;">${payload.organizationName ?? "-"}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">상품 수량</td><td style="padding:8px 0;">${payload.itemCount}개</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;">결제금액</td><td style="padding:8px 0;font-weight:600;">${payload.totalAmount.toLocaleString()}원</td></tr>
      </table>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!resendApiKey || !notifyToEmail || !notifyFromEmail || !notifySecret) {
    return Response.json(
      { error: "필수 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const requestSecret = request.headers.get("x-order-notify-secret");
  if (requestSecret !== notifySecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as OrderNotifyPayload;

    if (
      !payload.orderNumber ||
      !payload.customerName ||
      !payload.customerPhone ||
      !payload.totalAmount ||
      !payload.itemCount
    ) {
      return Response.json({ error: "필수 값이 누락되었습니다." }, { status: 400 });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: notifyFromEmail,
        to: [notifyToEmail],
        subject: `[RunHouse] 신규 주문 ${payload.orderNumber}`,
        html: buildHtml(payload),
      }),
    });

    if (!resendResponse.ok) {
      const body = await resendResponse.text();
      return Response.json(
        { error: `Resend 발송 실패: ${body}` },
        { status: 502 },
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
});
