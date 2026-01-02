-- ============================================
-- Migration: reviews 테이블 추가
-- 후기/갤러리 시스템
-- ============================================

-- 후기 상태 ENUM
DO $$ BEGIN
  CREATE TYPE runhousecustom.review_status AS ENUM (
    'pending',    -- 승인 대기
    'approved',   -- 승인됨
    'rejected'    -- 거절됨
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 후기 테이블
CREATE TABLE IF NOT EXISTS runhousecustom.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES runhousecustom.orders(id) ON DELETE SET NULL,

  -- 작성자 정보
  author_type VARCHAR(20) NOT NULL DEFAULT 'customer',  -- 'admin' 또는 'customer'
  author_name VARCHAR(100) NOT NULL,
  organization_name VARCHAR(200),  -- 단체명

  -- 후기 내용
  title VARCHAR(200),
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

  -- 이미지 (최대 5개)
  images JSONB DEFAULT '[]'::jsonb,
  /* 예시:
  [
    {"url": "https://...", "caption": "앞면 사진"},
    {"url": "https://...", "caption": "착용 사진"}
  ]
  */

  -- 상태 (관리자 작성은 자동 승인, 고객 작성은 승인 대기)
  status runhousecustom.review_status NOT NULL DEFAULT 'pending',

  -- 관리자 메모
  admin_memo TEXT,

  -- 메타
  is_featured BOOLEAN NOT NULL DEFAULT false,  -- 대표 후기 여부
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON runhousecustom.reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON runhousecustom.reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON runhousecustom.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_is_featured ON runhousecustom.reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON runhousecustom.reviews(created_at DESC);

-- 트리거 (updated_at 자동 갱신)
DROP TRIGGER IF EXISTS update_reviews_updated_at ON runhousecustom.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON runhousecustom.reviews
  FOR EACH ROW EXECUTE FUNCTION runhousecustom.update_updated_at_column();

-- RLS 활성화
ALTER TABLE runhousecustom.reviews ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Service role has full access to reviews" ON runhousecustom.reviews
  FOR ALL USING (auth.role() = 'service_role');

-- 익명 사용자는 승인된 후기만 조회 가능
CREATE POLICY "Anonymous users can view approved reviews" ON runhousecustom.reviews
  FOR SELECT USING (status = 'approved');

-- 익명 사용자도 후기 작성 가능 (승인 대기 상태로)
CREATE POLICY "Anonymous users can insert reviews" ON runhousecustom.reviews
  FOR INSERT WITH CHECK (true);

-- 코멘트
COMMENT ON TABLE runhousecustom.reviews IS '후기/갤러리';
COMMENT ON COLUMN runhousecustom.reviews.author_type IS '작성자 유형: admin(관리자), customer(고객)';
COMMENT ON COLUMN runhousecustom.reviews.status IS '후기 상태: pending(승인대기), approved(승인), rejected(거절)';
