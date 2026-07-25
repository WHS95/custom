-- ============================================
-- Migration: 크루 스토어 주문 개선
-- 1) size_collection_responses: 주문자 재확인용 phone_last4,
--    한 번의 제출(여러 사이즈·여러 굿즈)을 묶는 submission_id
-- 2) crew_stores: 상점 운영기간(open_from/open_until)
-- ============================================

ALTER TABLE runhousecustom.size_collection_responses
  ADD COLUMN IF NOT EXISTS phone_last4 VARCHAR(4),      -- 휴대폰 뒷 4자리 (이름과 함께 본인 확인)
  ADD COLUMN IF NOT EXISTS submission_id UUID;          -- 같은 제출 묶음 (상품 경계를 넘어 공유)

-- 이름+뒷4자리 조회용 (상점 단위 내 주문 확인)
CREATE INDEX IF NOT EXISTS idx_scr_name_phone4
  ON runhousecustom.size_collection_responses(name, phone_last4);

CREATE INDEX IF NOT EXISTS idx_scr_submission
  ON runhousecustom.size_collection_responses(submission_id);

ALTER TABLE runhousecustom.crew_stores
  ADD COLUMN IF NOT EXISTS open_from DATE,              -- 상점 운영 시작일 (NULL = 제한 없음)
  ADD COLUMN IF NOT EXISTS open_until DATE;             -- 상점 운영 종료일 (NULL = 제한 없음)
