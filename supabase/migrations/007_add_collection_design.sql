-- ============================================
-- Migration: 크루 스토어 — 취합에 확정 디자인 첨부
-- 운영진이 스튜디오에서 확정한 커스텀 디자인을 취합(크루 전용 스토어)에 등록
-- ============================================

ALTER TABLE runhousecustom.size_collections
  ADD COLUMN IF NOT EXISTS design_snapshot JSONB,      -- DesignLayer[] (확정 디자인)
  ADD COLUMN IF NOT EXISTS design_color_id VARCHAR(50); -- 디자인이 적용된 색상 (설정 시 색상 고정)
