/**
 * Supabase Auth 브라우저 클라이언트
 *
 * 클라이언트 사이드 전용 — "use client" 컴포넌트에서 안전하게 import 가능
 */

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 브라우저(클라이언트 사이드)용 Supabase Auth 클라이언트
 */
export function createAuthBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
