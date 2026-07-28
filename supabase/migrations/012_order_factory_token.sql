-- ============================================
-- Migration: 주문 공장 확인 토큰 (order factory token)
-- 크루 스토어 주문 확정 시, 공장이 토큰 링크로 주문의 시안·사이즈·수량·배송지를
-- 확인할 수 있게 orders에 추측 불가한 factory_token을 부여한다.
-- (manufacture_reviews.review_token 패턴과 동일)
-- ============================================

ALTER TABLE runhousecustom.orders
  ADD COLUMN IF NOT EXISTS factory_token TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_factory_token
  ON runhousecustom.orders (factory_token)
  WHERE factory_token IS NOT NULL;
