/**
 * 관리자 로그아웃 API
 * POST: 로그아웃
 */

import { NextResponse } from 'next/server'

/**
 * POST /api/admin/logout
 * 관리자 로그아웃
 */
export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: '로그아웃 되었습니다'
  })

  // 쿠키 삭제
  response.cookies.delete('admin_auth')
  response.cookies.delete('admin_id')
  response.cookies.delete('tenant_id')
  response.cookies.delete('tenant_slug')

  return response
}
