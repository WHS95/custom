-- ============================================
-- Migration: 그로블(Groble) 결제 연동
-- 주문에 결제 링크/결제 상태 추가 + 웹훅 이벤트 로그
-- ============================================

-- 주문 결제 필드
ALTER TABLE runhousecustom.orders
  ADD COLUMN IF NOT EXISTS payment_link TEXT,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refund_requested')),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 그로블 웹훅 이벤트 로그 (멱등 처리 + 감사 추적)
CREATE TABLE IF NOT EXISTS runhousecustom.groble_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT UNIQUE NOT NULL,   -- X-Groble-Idempotency-Key
  event_id TEXT,                          -- 페이로드의 이벤트 id
  event_type TEXT NOT NULL,               -- payment.completed 등
  payload JSONB NOT NULL,
  matched_order_id UUID REFERENCES runhousecustom.orders(id) ON DELETE SET NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_groble_webhook_events_event_type
  ON runhousecustom.groble_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status
  ON runhousecustom.orders(payment_status);

-- RLS: Next.js API(Service Role) 경유만 허용
ALTER TABLE runhousecustom.groble_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to groble_webhook_events"
  ON runhousecustom.groble_webhook_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
