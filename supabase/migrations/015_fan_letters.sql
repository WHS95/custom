-- ============================================
-- Migration: 크루 상점 팬레터 (fan letters)
-- 팬(크루원·방문자)이 크루에게 응원 메시지를 남긴다(이미지 첨부·좋아요·댓글).
-- 비로그인 익명(이름 기반). 운영진은 부적절한 글을 숨길 수 있다.
-- ============================================

CREATE TABLE IF NOT EXISTS runhousecustom.fan_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES runhousecustom.crew_stores(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  like_count INTEGER NOT NULL DEFAULT 0,
  hidden BOOLEAN NOT NULL DEFAULT false,   -- 운영진 숨김(모더레이션)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fan_letters_store
  ON runhousecustom.fan_letters (store_id, hidden, created_at DESC);

CREATE TABLE IF NOT EXISTS runhousecustom.fan_letter_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fan_letter_id UUID NOT NULL REFERENCES runhousecustom.fan_letters(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  is_owner BOOLEAN NOT NULL DEFAULT false, -- 운영진(크루) 답글 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fan_letter_comments_letter
  ON runhousecustom.fan_letter_comments (fan_letter_id, created_at);

-- 앱은 service_role 서버 라우트로만 접근 (커스텀 인증)
ALTER TABLE runhousecustom.fan_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE runhousecustom.fan_letter_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS fan_letters_service ON runhousecustom.fan_letters;
CREATE POLICY fan_letters_service ON runhousecustom.fan_letters
  FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS fan_letter_comments_service ON runhousecustom.fan_letter_comments;
CREATE POLICY fan_letter_comments_service ON runhousecustom.fan_letter_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 좋아요 원자적 증가 함수 (브라우저별 1회는 클라이언트 localStorage로 가드)
CREATE OR REPLACE FUNCTION runhousecustom.increment_fan_letter_like(p_id UUID)
RETURNS INTEGER LANGUAGE sql AS $$
  UPDATE runhousecustom.fan_letters SET like_count = like_count + 1
  WHERE id = p_id RETURNING like_count;
$$;
