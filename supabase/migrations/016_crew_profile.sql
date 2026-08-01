-- ============================================
-- Migration: 크루 정체성 프로필 (crew identity)
-- 크루 상점 둘러보기 카드/상점에 노출할 로고·소개글·활동지역.
-- 회원가입·상점 설정에서 수정한다. 크루 계정당 1개 = user_profiles에 둔다.
-- ============================================

ALTER TABLE runhousecustom.user_profiles
  ADD COLUMN IF NOT EXISTS crew_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS crew_intro TEXT,
  ADD COLUMN IF NOT EXISTS crew_region TEXT;
