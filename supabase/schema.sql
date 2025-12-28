-- ============================================
-- Supabase Schema: runhousecustom
-- 커스텀 주문 관리 시스템
-- ============================================

-- 스키마 생성
CREATE SCHEMA IF NOT EXISTS runhousecustom;

-- 스키마를 기본으로 설정
SET search_path TO runhousecustom;

-- ============================================
-- ENUM 타입
-- ============================================

-- 주문 상태
CREATE TYPE order_status AS ENUM (
  'pending',           -- 주문 접수
  'design_confirmed',  -- 디자인 확정
  'preparing',         -- 제작 준비
  'in_production',     -- 제작 진행
  'shipped',           -- 배송 중
  'delivered',         -- 배송 완료
  'cancelled'          -- 주문 취소
);

-- ============================================
-- 테이블: 테넌트 (커스텀 업체)
-- ============================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,  -- URL용 슬러그
  logo_url TEXT,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(20),
  settings JSONB NOT NULL DEFAULT '{
    "basePrice": 22400,
    "shippingFreeThreshold": 50000,
    "shippingCost": 3000,
    "currency": "KRW"
  }'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 런하우스 기본 테넌트 삽입
INSERT INTO tenants (id, name, slug, contact_email, settings) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '런하우스',
  'runhouse',
  'contact@runhouse.kr',
  '{
    "basePrice": 22400,
    "shippingFreeThreshold": 50000,
    "shippingCost": 3000,
    "currency": "KRW"
  }'::jsonb
);

-- ============================================
-- 테이블: 상품
-- ============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'hat',  -- 'hat', 'clothing', 'accessory'
  base_price INTEGER NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  /* 예시:
  [
    {"colorId": "black", "view": "front", "url": "https://..."},
    {"colorId": "black", "view": "back", "url": "https://..."}
  ]
  */
  variants JSONB DEFAULT '[]'::jsonb,
  /* 예시:
  [
    {"id": "black", "label": "Midnight Black", "hex": "#000000", "sizes": ["S", "M", "L", "XL", "FREE"]}
  ]
  */
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, slug)
);

-- 인덱스
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ============================================
-- 테이블: 상품 커스터마이즈 영역
-- ============================================

CREATE TABLE product_customizable_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  view_name VARCHAR(20) NOT NULL,       -- 'front', 'back', 'left', 'right', 'top'
  display_name VARCHAR(50) NOT NULL,    -- '정면', '후면' 등
  zone_x DECIMAL(5,2) NOT NULL,         -- 인쇄 가능 영역 X (%)
  zone_y DECIMAL(5,2) NOT NULL,         -- 인쇄 가능 영역 Y (%)
  zone_width DECIMAL(5,2) NOT NULL,     -- 인쇄 가능 영역 너비 (%)
  zone_height DECIMAL(5,2) NOT NULL,    -- 인쇄 가능 영역 높이 (%)
  image_url TEXT,                       -- 해당 뷰의 기본 이미지
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(product_id, view_name)
);

-- 인덱스
CREATE INDEX idx_product_customizable_areas_product_id ON product_customizable_areas(product_id);

-- ============================================
-- 테이블: 고객
-- ============================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20) NOT NULL,
  organization_name VARCHAR(200),  -- 단체명
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================
-- 테이블: 주문
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,  -- RH-20241219-001
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- 고객 정보
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),

  -- 배송 정보 (JSON)
  shipping_info JSONB NOT NULL,
  /* 예시:
  {
    "recipientName": "홍길동",
    "phone": "010-1234-5678",
    "zipCode": "12345",
    "address": "서울시 강남구 테헤란로 123",
    "addressDetail": "456호",
    "organizationName": "런하우스",
    "memo": "부재시 경비실에 맡겨주세요"
  }
  */

  -- 금액 정보
  subtotal INTEGER NOT NULL,       -- 상품 합계
  shipping_cost INTEGER NOT NULL,  -- 배송비
  total_amount INTEGER NOT NULL,   -- 총 결제금액

  -- 상태
  status order_status NOT NULL DEFAULT 'pending',

  -- 관리자 메모
  admin_memo TEXT,

  -- 배송 추적 정보
  tracking_info JSONB DEFAULT NULL,
  /* 예시:
  {
    "carrier": "cj",
    "trackingNumber": "123456789012",
    "shippedAt": "2024-12-20T10:00:00Z"
  }
  */

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- 테이블: 주문 아이템
-- ============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,

  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  color VARCHAR(50) NOT NULL,
  color_label VARCHAR(100) NOT NULL,
  size VARCHAR(10) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  total_price INTEGER NOT NULL,

  -- 디자인 스냅샷 (주문 시점의 디자인 저장)
  design_snapshot JSONB NOT NULL,
  /* 예시:
  [
    {
      "id": "abc123",
      "type": "image",
      "content": "data:image/png;base64,...",
      "x": 50, "y": 50,
      "width": 100, "height": 100,
      "rotation": 0,
      "flipX": false, "flipY": false,
      "view": "front"
    }
  ]
  */

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- 테이블: 주문 상태 변경 이력
-- ============================================

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status order_status,
  to_status order_status NOT NULL,
  changed_by VARCHAR(100) NOT NULL,  -- 'admin', 'system', 관리자 이름
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- ============================================
-- 함수: 오늘 주문 수 조회 (주문번호 생성용)
-- ============================================

CREATE OR REPLACE FUNCTION get_today_order_count(p_tenant_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_result
  FROM orders
  WHERE tenant_id = p_tenant_id
    AND DATE(created_at AT TIME ZONE 'Asia/Seoul') = DATE(NOW() AT TIME ZONE 'Asia/Seoul');
  RETURN count_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 함수: 주문번호 생성
-- ============================================

CREATE OR REPLACE FUNCTION generate_order_number(p_tenant_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  tenant_slug VARCHAR(50);
  today_count INTEGER;
  date_str VARCHAR(8);
  order_number VARCHAR(20);
BEGIN
  -- 테넌트 슬러그 조회
  SELECT UPPER(SUBSTRING(slug FROM 1 FOR 2)) INTO tenant_slug
  FROM tenants WHERE id = p_tenant_id;

  -- 오늘 날짜
  date_str := TO_CHAR(NOW() AT TIME ZONE 'Asia/Seoul', 'YYYYMMDD');

  -- 오늘 주문 수 + 1
  today_count := get_today_order_count(p_tenant_id) + 1;

  -- 주문번호 생성
  order_number := tenant_slug || '-' || date_str || '-' || LPAD(today_count::TEXT, 3, '0');

  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트리거: updated_at 자동 갱신
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 트리거: 주문 상태 변경 시 이력 자동 생성
-- ============================================

CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, 'system');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

-- RLS 활성화
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- 서비스 역할은 모든 접근 허용
CREATE POLICY "Service role has full access to tenants" ON tenants
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to customers" ON customers
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to orders" ON orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to order_items" ON order_items
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to order_status_history" ON order_status_history
  FOR ALL USING (auth.role() = 'service_role');

-- products, product_customizable_areas RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_customizable_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to products" ON products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to product_customizable_areas" ON product_customizable_areas
  FOR ALL USING (auth.role() = 'service_role');

-- 익명 사용자 상품 조회
CREATE POLICY "Anonymous users can view active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anonymous users can view product areas" ON product_customizable_areas
  FOR SELECT USING (true);

-- 익명 사용자 테넌트 조회
CREATE POLICY "Anonymous users can view tenants" ON tenants
  FOR SELECT USING (true);

-- 익명 사용자 주문 조회 (전화번호 기반)
CREATE POLICY "Anonymous users can view their orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can view order items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Anonymous users can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anonymous users can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 테이블: 테넌트 관리자 계정
-- ============================================

CREATE TABLE tenant_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
  display_name VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_tenant_admins_tenant_id ON tenant_admins(tenant_id);
CREATE INDEX idx_tenant_admins_username ON tenant_admins(username);

-- 트리거
CREATE TRIGGER update_tenant_admins_updated_at
  BEFORE UPDATE ON tenant_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE tenant_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to tenant_admins" ON tenant_admins
  FOR ALL USING (auth.role() = 'service_role');

-- 런하우스 기본 관리자 계정 (bcrypt hash of 'runrun123!')
INSERT INTO tenant_admins (tenant_id, username, password_hash, display_name) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'runhouse_admin',
  '$2b$10$09c80xBHiNkFJPyt1DEXyuPG6mj7XQor6p9eA7ACl7r824VyJ4Awm',
  '런하우스 관리자'
);

COMMENT ON TABLE tenant_admins IS '테넌트 관리자 계정';

-- ============================================
-- 뷰: 주문 목록 (관리자용)
-- ============================================

CREATE OR REPLACE VIEW order_list_view AS
SELECT
  o.id,
  o.order_number,
  o.tenant_id,
  t.name AS tenant_name,
  o.customer_name,
  o.customer_phone,
  o.shipping_info->>'recipientName' AS recipient_name,
  o.shipping_info->>'organizationName' AS organization_name,
  o.subtotal,
  o.shipping_cost,
  o.total_amount,
  o.status,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count,
  (SELECT SUM(quantity) FROM order_items WHERE order_id = o.id) AS total_quantity,
  o.admin_memo,
  o.created_at,
  o.updated_at
FROM orders o
JOIN tenants t ON o.tenant_id = t.id
ORDER BY o.created_at DESC;

-- ============================================
-- 코멘트
-- ============================================

COMMENT ON SCHEMA runhousecustom IS '커스텀 주문 관리 시스템';
COMMENT ON TABLE tenants IS '테넌트 (커스텀 업체) - 멀티테넌트 지원';
COMMENT ON TABLE customers IS '고객 정보';
COMMENT ON TABLE orders IS '주문';
COMMENT ON TABLE order_items IS '주문 아이템';
COMMENT ON TABLE order_status_history IS '주문 상태 변경 이력';
COMMENT ON TABLE products IS '상품';
COMMENT ON TABLE product_customizable_areas IS '상품 커스터마이즈 영역';

-- ============================================
-- 기본 상품 데이터: 런하우스 커스텀 모자
-- ============================================

INSERT INTO products (id, tenant_id, name, slug, description, category, base_price, variants) VALUES (
  'p0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Custom Cap',
  'custom-cap',
  '나만의 디자인을 담은 커스텀 모자. 고품질 원단과 정교한 자수로 제작됩니다.',
  'hat',
  22400,
  '[
    {"id": "black", "label": "Midnight Black", "hex": "#000000", "sizes": ["S", "M", "L", "XL", "FREE"]},
    {"id": "khaki", "label": "Desert Khaki", "hex": "#C3B091", "sizes": ["S", "M", "L", "XL", "FREE"]},
    {"id": "beige", "label": "Sand Beige", "hex": "#F5F5DC", "sizes": ["S", "M", "L", "XL", "FREE"]},
    {"id": "red", "label": "Race Red", "hex": "#FF0000", "sizes": ["S", "M", "L", "XL", "FREE"]}
  ]'::jsonb
);

-- 커스터마이즈 영역 (모자 5면)
INSERT INTO product_customizable_areas (product_id, view_name, display_name, zone_x, zone_y, zone_width, zone_height, sort_order) VALUES
  ('p0000000-0000-0000-0000-000000000001', 'front', '정면', 30, 30, 40, 30, 1),
  ('p0000000-0000-0000-0000-000000000001', 'back', '후면', 30, 40, 40, 20, 2),
  ('p0000000-0000-0000-0000-000000000001', 'left', '좌측', 30, 40, 40, 20, 3),
  ('p0000000-0000-0000-0000-000000000001', 'right', '우측', 30, 40, 40, 20, 4),
  ('p0000000-0000-0000-0000-000000000001', 'top', '상단', 25, 25, 50, 50, 5);
