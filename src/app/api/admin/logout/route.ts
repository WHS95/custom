/**
 * 관리자 로그아웃 API
 * POST: 로그아웃
 */

import { NextResponse } from 'next/server'
import { ADMIN_SESSION_COOKIE } from '@/lib/auth/admin-auth'

/**
 * POST /api/admin/logout
 * 관리자 로그아웃
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: '로그아웃 되었습니다'
  })

  response.cookies.delete(ADMIN_SESSION_COOKIE)
  // 레거시 쿠키도 함께 정리 (구버전 세션 잔재)
  response.cookies.delete('admin_auth')
  response.cookies.delete('admin_id')
  response.cookies.delete('tenant_id')
  response.cookies.delete('tenant_slug')

  return response
}
