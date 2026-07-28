-- ============================================
-- Migration: 크루 할인 승인 분리 (crew discount approval)
-- 런하우스맵 SSO 연동을 끊고 자체 이메일 회원가입으로 전환한다.
-- 가입 즉시 crew_staff(상점·제작·알림 전체 기능)가 되고,
-- 10% 할인만 관리자 승인 대상으로 분리한다.
--
-- - instagram              : 가입 시 입력한 인스타 핸들(할인 심사 참고)
-- - runhouse_map_registered: "런하우스크루맵 등록 여부" 자가신고 체크박스
--                            (맵 연동을 끊었으므로 자동 검증 없음 → 관리자 확인용)
-- - discount_status        : null(개인) | pending(승인대기) | approved | rejected
-- - discount_reviewed_at   : 승인/거절 처리 시각(알림 피드 생성 기준)
--
-- ⚠️ 백필: 기존 crew_staff는 이미 할인 대상이었으므로 approved로 채운다.
--    (게이팅을 user_type→discount_status로 바꾸면서 발생하는 할인 회귀 방지)
-- ============================================

ALTER TABLE runhousecustom.user_profiles
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS runhouse_map_registered BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_status TEXT
    CHECK (discount_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS discount_reviewed_at TIMESTAMPTZ;

-- 기존 승인 크루(할인 대상) 백필
UPDATE runhousecustom.user_profiles
SET discount_status = 'approved',
    discount_reviewed_at = COALESCE(discount_reviewed_at, updated_at)
WHERE user_type = 'crew_staff'
  AND discount_status IS NULL;

-- 기존 승인 대기(crew_pending)는 할인 대기로 이관
UPDATE runhousecustom.user_profiles
SET discount_status = 'pending'
WHERE user_type = 'crew_pending'
  AND discount_status IS NULL;

-- 대기 목록 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_discount_status
  ON runhousecustom.user_profiles (discount_status);
