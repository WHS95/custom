-- ============================================
-- Migration: 크루원 개인화 이름 (per-member custom name)
-- 유니폼에 각자 새길 이름/등번호. 제출자 실명(name)과 별개 값(영문·닉네임 등).
-- 상점 굿즈가 "이름 개인화"(디자인에 이름 자리 레이어 포함)일 때 제출 폼에서 입력받는다.
-- ============================================

ALTER TABLE runhousecustom.size_collection_responses
  ADD COLUMN IF NOT EXISTS custom_name TEXT;
