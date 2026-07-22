-- ============================================
-- Migration: 단체 주문 사이즈 취합 (size collections)
-- 크루 운영진이 링크를 만들어 크루원 사이즈/색상을 취합하고 주문으로 전환
-- ============================================

-- 취합 링크
CREATE TABLE IF NOT EXISTS runhousecustom.size_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,

  -- 공유용 토큰(크루원 제출 링크) / 관리용 토큰(운영진 전용)
  token VARCHAR(64) UNIQUE NOT NULL,
  admin_token VARCHAR(64) UNIQUE NOT NULL,

  title VARCHAR(200) NOT NULL,            -- 예: "한강크루 2026 여름 단체티"
  crew_name VARCHAR(200),                 -- 크루/단체명
  product_id UUID REFERENCES runhousecustom.products(id) ON DELETE SET NULL,
  allowed_colors JSONB DEFAULT '[]'::jsonb, -- 허용 색상 ID 배열 (빈 배열 = 전체 허용)
  unit_price INTEGER,                     -- 1인당 안내 가격 (원)
  deposit_info TEXT,                      -- 입금 계좌/안내 문구
  deadline TIMESTAMPTZ,                   -- 마감일 (지나면 제출 차단)
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'ordered')),
  order_number VARCHAR(50),               -- 주문 전환 시 생성된 주문번호
  creator_user_id UUID,                   -- 생성자(로그인한 경우)

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 크루원 제출
CREATE TABLE IF NOT EXISTS runhousecustom.size_collection_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES runhousecustom.size_collections(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,             -- 크루원 이름/닉네임
  color_id VARCHAR(50),                   -- 선택한 색상 ID
  size VARCHAR(20) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1 AND quantity <= 20),
  note TEXT,                              -- 요청사항 (등번호 등)
  is_paid BOOLEAN NOT NULL DEFAULT false, -- 입금 확인 (운영진 체크)
  edit_token VARCHAR(64) NOT NULL,        -- 본인 수정/삭제용 토큰

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_size_collections_token ON runhousecustom.size_collections(token);
CREATE INDEX IF NOT EXISTS idx_size_collections_tenant_id ON runhousecustom.size_collections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_size_collection_responses_collection_id
  ON runhousecustom.size_collection_responses(collection_id);

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION runhousecustom.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_size_collections_updated_at ON runhousecustom.size_collections;
CREATE TRIGGER trg_size_collections_updated_at
  BEFORE UPDATE ON runhousecustom.size_collections
  FOR EACH ROW EXECUTE FUNCTION runhousecustom.set_updated_at();

DROP TRIGGER IF EXISTS trg_size_collection_responses_updated_at ON runhousecustom.size_collection_responses;
CREATE TRIGGER trg_size_collection_responses_updated_at
  BEFORE UPDATE ON runhousecustom.size_collection_responses
  FOR EACH ROW EXECUTE FUNCTION runhousecustom.set_updated_at();

-- RLS: 모든 접근은 Next.js API(Service Role) 경유. 익명 직접 접근 차단
ALTER TABLE runhousecustom.size_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE runhousecustom.size_collection_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to size_collections"
  ON runhousecustom.size_collections
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to size_collection_responses"
  ON runhousecustom.size_collection_responses
  FOR ALL TO service_role USING (true) WITH CHECK (true);
