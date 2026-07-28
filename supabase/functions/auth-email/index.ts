// 인증 관련 사용자 대상 메일 발송 (비밀번호 재설정 등)
// order-notify 패턴을 그대로 따르되, 수신자가 "요청한 사용자"라는 점이 다르다.
// 필수 시크릿: RESEND_API_KEY, AUTH_EMAIL_FROM_EMAIL(없으면 ORDER_NOTIFY_FROM_EMAIL),
//             AUTH_EMAIL_FUNCTION_SECRET
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail =
  Deno.env.get("AUTH_EMAIL_FROM_EMAIL") ?? Deno.env.get("ORDER_NOTIFY_FROM_EMAIL");
const functionSecret = Deno.env.get("AUTH_EMAIL_FUNCTION_SECRET");

interface AuthEmailPayload {
  type: "password_reset";
  to: string;
  resetUrl: string;
}

function buildPasswordResetHtml(resetUrl: string) {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#111827;">
      <h2 style="margin:0 0 8px;font-size:20px;">비밀번호 재설정</h2>
      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        아래 버튼을 눌러 새 비밀번호를 설정하세요. 이 링크는 30분간 유효합니다.<br/>
        본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#0B0C0A;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">
        비밀번호 재설정하기
      </a>
      <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;word-break:break-all;">
        버튼이 열리지 않으면 아래 주소를 복사해 붙여넣으세요:<br/>${resetUrl}
      </p>
    </div>
  `;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!resendApiKey || !fromEmail || !functionSecret) {
    return Response.json(
      { error: "필수 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const requestSecret = request.headers.get("x-auth-email-secret");
  if (requestSecret !== functionSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as AuthEmailPayload;

    if (payload.type !== "password_reset" || !payload.to || !payload.resetUrl) {
      return Response.json({ error: "필수 값이 누락되었습니다." }, { status: 400 });
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: "[RunHouse] 비밀번호 재설정 안내",
        html: buildPasswordResetHtml(payload.resetUrl),
      }),
    });

    if (!resendResponse.ok) {
      const body = await resendResponse.text();
      return Response.json({ error: `Resend 발송 실패: ${body}` }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
});
