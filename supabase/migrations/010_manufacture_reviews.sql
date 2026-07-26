-- ============================================
-- Migration: 제작 가능 여부 확인 (manufacturability review)
-- 크루장이 스튜디오 커스텀 → 상점 등록 전에 공장 제작 가능 여부를 확인받는다.
-- 흐름: 크루장 요청(pending) → 공장 사장님 토큰 링크로 판정(approved/rejected)
--       → 승인된 리뷰로만 상점 등록 가능
-- 디자인은 design_snapshot(레이어)으로 저장 — 승인 후 등록 시 size_collections로 복사
-- ============================================

CREATE TABLE IF NOT EXISTS runhousecustom.manufacture_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL,          -- 요청한 크루장 (customer_auth_users.id)
  crew_name VARCHAR(200),                 -- 요청 시점 크루명 스냅샷

  -- 리뷰 대상 디자인
  product_id UUID NOT NULL,               -- 베이스 상품
  color_id VARCHAR(50) NOT NULL,          -- 디자인 색상
  design_snapshot JSONB NOT NULL,         -- DesignLayer[]
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,  -- AttachmentFile[] (참고 파일)
  note TEXT,                              -- 크루장 요청 메모

  -- 판정
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  review_token VARCHAR(64) UNIQUE NOT NULL,  -- 공장 확인 링크용 (추측 불가)
  factory_comment TEXT,                   -- 공장 사장님 의견
  reviewed_at TIMESTAMPTZ,                -- 판정 시각

  -- 등록 연결 (승인 후 상점에 등록되면 기록 — 중복 등록 방지)
  registered_collection_id UUID REFERENCES runhousecustom.size_collections(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_manufacture_reviews_creator
  ON runhousecustom.manufacture_reviews(creator_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_manufacture_reviews_status
  ON runhousecustom.manufacture_reviews(status);

ALTER TABLE runhousecustom.manufacture_reviews ENABLE ROW LEVEL SECURITY;

-- service_role 전용 (앱은 커스텀 인증 → 모든 접근을 서버 라우트에서 처리)
CREATE POLICY "Service role full access to manufacture_reviews"
  ON runhousecustom.manufacture_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- creator FK (customer_auth_users)
ALTER TABLE runhousecustom.manufacture_reviews
  DROP CONSTRAINT IF EXISTS manufacture_reviews_creator_user_id_fkey;
ALTER TABLE runhousecustom.manufacture_reviews
  ADD CONSTRAINT manufacture_reviews_creator_user_id_fkey
  FOREIGN KEY (creator_user_id)
  REFERENCES runhousecustom.customer_auth_users(id)
  ON DELETE CASCADE;
