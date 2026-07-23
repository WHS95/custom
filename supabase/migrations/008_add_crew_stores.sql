-- ============================================
-- Migration: 크루 스토어 (상설 크루 전용 상점)
-- 크루 계정당 1개 스토어, 스튜디오에서 등록한 커스텀 상품(취합)들을 묶어서 노출
-- ============================================

CREATE TABLE IF NOT EXISTS runhousecustom.crew_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,
  creator_user_id UUID UNIQUE NOT NULL,   -- 크루 계정당 스토어 1개
  store_token VARCHAR(64) UNIQUE NOT NULL, -- 추측 불가능한 공유 토큰 (/store/{token})
  crew_name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE runhousecustom.size_collections
  ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES runhousecustom.crew_stores(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_size_collections_store_id
  ON runhousecustom.size_collections(store_id);

ALTER TABLE runhousecustom.crew_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to crew_stores"
  ON runhousecustom.crew_stores
  FOR ALL TO service_role USING (true) WITH CHECK (true);
