/**
 * 인증 관련 사용자 대상 메일 발송 래퍼 (Supabase Edge Function `auth-email` 호출).
 * order-email.ts 패턴과 동일 — 환경변수 미설정 시 조용히 false 반환(앱 흐름 영향 없음).
 */
const AUTH_EMAIL_FUNCTION_URL = process.env.SUPABASE_AUTH_EMAIL_FUNCTION_URL;
const AUTH_EMAIL_SECRET = process.env.AUTH_EMAIL_FUNCTION_SECRET;

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  if (!AUTH_EMAIL_FUNCTION_URL || !AUTH_EMAIL_SECRET) {
    console.warn(
      "[AuthEmail] SUPABASE_AUTH_EMAIL_FUNCTION_URL / AUTH_EMAIL_FUNCTION_SECRET 미설정 — 메일 발송 생략",
    );
    return false;
  }

  try {
    const response = await fetch(AUTH_EMAIL_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth-email-secret": AUTH_EMAIL_SECRET,
      },
      body: JSON.stringify({ type: "password_reset", to, resetUrl }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[AuthEmail] Edge Function 호출 실패:", response.status, body);
      return false;
    }

    return true;
  } catch (error) {
    console.error("[AuthEmail] 비밀번호 재설정 메일 발송 실패:", error);
    return false;
  }
}
