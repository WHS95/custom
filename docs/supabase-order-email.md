# Supabase Order Email

## Next.js env

```env
SUPABASE_ORDER_NOTIFY_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/order-notify
ORDER_NOTIFY_FUNCTION_SECRET=<shared-secret>
```

## Supabase Edge Function secrets

```bash
supabase secrets set RESEND_API_KEY=...
supabase secrets set ORDER_NOTIFY_TO_EMAIL=tjdngur22@gmail.com
supabase secrets set ORDER_NOTIFY_FROM_EMAIL=orders@your-domain.com
supabase secrets set ORDER_NOTIFY_FUNCTION_SECRET=<shared-secret>
```

## Deploy

```bash
supabase functions deploy order-notify
```
