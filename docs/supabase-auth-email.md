# Supabase Auth Email (비밀번호 재설정 메일)

커스텀 인증(`customer_auth_users`, Supabase Auth 아님)이라 Supabase Auth의 재설정 메일을
쓸 수 없다. 대신 Edge Function `auth-email` + Resend로 재설정 링크 메일을 발송한다.
(`order-notify`와 동일 패턴)

## 흐름
`POST /api/auth/forgot-password` → 재설정 토큰 생성(`customer_password_reset_tokens`)
→ `sendPasswordResetEmail(user.email, resetUrl)`(`src/lib/auth-email.ts`)
→ Edge Function `auth-email` → Resend 발송 → 사용자가 `/reset-password?token=`에서 새 비번 설정.

> env 미설정 시 메일 발송은 조용히 스킵되고, 개발 환경에서는 `previewUrl`로 링크가 노출된다.

## Next.js env (Vercel Production)
```env
SUPABASE_AUTH_EMAIL_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/auth-email
AUTH_EMAIL_FUNCTION_SECRET=<shared-secret>
# (선택) 링크 베이스: 없으면 요청 origin, 최종 폴백 runhouse-custom.vercel.app
NEXT_PUBLIC_SITE_URL=https://runhouse-custom.vercel.app
```

## Supabase Edge Function secrets
```bash
supabase secrets set RESEND_API_KEY=...
# 발신 주소 — Resend에서 인증된 도메인이어야 함 (미설정 시 ORDER_NOTIFY_FROM_EMAIL 폴백)
supabase secrets set AUTH_EMAIL_FROM_EMAIL="RunHouse <no-reply@runhouse.club>"
supabase secrets set AUTH_EMAIL_FUNCTION_SECRET=<shared-secret>
```

## Deploy
```bash
supabase functions deploy auth-email
```

## 사전조건
- Resend 계정 + **발신 도메인 DNS 인증**(SPF/DKIM). 인증 전까지는 임의 수신자 발송 불가.
- `AUTH_EMAIL_FUNCTION_SECRET`는 Next env와 Supabase secret 값이 동일해야 한다(호출 인증).
