-- ============================================
-- Migration: 크루원 디자인 제안 (design proposals)
-- 크루원(비로그인)이 스튜디오에서 디자인을 만들어 운영진의 크루 상점에 "제안"한다.
-- 운영진이 채택하면 기존 제작 문의(manufacture_reviews) 파이프라인으로 변환되어
-- 공장 재승인을 거친 뒤 상점에 등록된다.
-- 흐름: 크루원 제안(pending) → 운영진 채택(adopted, review 생성) / 반려(rejected)
-- ============================================

CREATE TABLE IF NOT EXISTS runhousecustom.design_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES runhousecustom.crew_stores(id) ON DELETE CASCADE,

  -- 제안 디자인
  product_id UUID NOT NULL,               -- 베이스 상품
  color_id VARCHAR(50) NOT NULL,          -- 디자인 색상
  design_snapshot JSONB NOT NULL,         -- DesignLayer[]
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,  -- 레퍼런스(AttachmentFile[])
  note TEXT,                              -- 제안 메모

  -- 제안자 (비로그인 크루원)
  proposer_name VARCHAR(100) NOT NULL,
  proposer_contact VARCHAR(100),          -- 연락처(선택)

  -- 운영진 판정
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'adopted', 'rejected')),
  adopted_review_id UUID REFERENCES runhousecustom.manufacture_reviews(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_design_proposals_store
  ON runhousecustom.design_proposals (store_id, status, created_at DESC);

-- 앱은 service_role 서버 라우트로만 접근 (커스텀 인증)
ALTER TABLE runhousecustom.design_proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS design_proposals_service ON runhousecustom.design_proposals;
CREATE POLICY design_proposals_service ON runhousecustom.design_proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);
