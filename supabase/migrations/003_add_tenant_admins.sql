-- ============================================
-- Migration: tenant_admins 테이블 추가
-- 테넌트별 관리자 계정 시스템
-- ============================================

-- 테이블 생성
CREATE TABLE IF NOT EXISTS runhousecustom.tenant_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES runhousecustom.tenants(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,  -- bcrypt hashed
  display_name VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tenant_admins_tenant_id ON runhousecustom.tenant_admins(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_admins_username ON runhousecustom.tenant_admins(username);

-- 트리거 (updated_at 자동 갱신)
CREATE TRIGGER update_tenant_admins_updated_at
  BEFORE UPDATE ON runhousecustom.tenant_admins
  FOR EACH ROW EXECUTE FUNCTION runhousecustom.update_updated_at_column();

-- RLS 활성화
ALTER TABLE runhousecustom.tenant_admins ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Service role has full access to tenant_admins" ON runhousecustom.tenant_admins
  FOR ALL USING (auth.role() = 'service_role');

-- 코멘트
COMMENT ON TABLE runhousecustom.tenant_admins IS '테넌트 관리자 계정';

-- ============================================
-- 런하우스 기본 관리자 계정 삽입
-- 아이디: runhouse_admin
-- 비밀번호: runrun123! (bcrypt hashed)
-- ============================================

INSERT INTO runhousecustom.tenant_admins (tenant_id, username, password_hash, display_name) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'runhouse_admin',
  '$2b$10$09c80xBHiNkFJPyt1DEXyuPG6mj7XQor6p9eA7ACl7r824VyJ4Awm',
  '런하우스 관리자'
) ON CONFLICT (username) DO NOTHING;
