-- ============================================
-- Migration: 인쇄 영역 실측 치수 (physical print size)
-- 공장(전사/실사출력)이 시안만으로 치수를 파악하고 바로 작업할 수 있도록
-- 인쇄 영역의 실제 물리 가로 폭(cm)을 상품·색상·뷰별로 저장한다.
-- 높이(cm)는 인쇄 영역(zone)의 종횡비로 파생하므로 별도 저장하지 않는다
-- (화면과 인쇄물이 왜곡 없이 1:1 대응).
-- ============================================

ALTER TABLE runhousecustom.product_customizable_areas
  ADD COLUMN IF NOT EXISTS print_width_cm NUMERIC;

COMMENT ON COLUMN runhousecustom.product_customizable_areas.print_width_cm IS
  '인쇄 영역의 실제 가로 폭(cm). 실측값. 높이는 zone_width:zone_height 비율로 파생.';
