/**
 * Supabase Auth 서버 클라이언트
 *
 * 서버 컴포넌트, API 라우트, 미들웨어에서 사용
 * next/headers를 사용하므로 서버 사이드에서만 import 가능
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 서버 사이드용 Supabase Auth 클라이언트
 * 서버 컴포넌트, API 라우트에서 사용
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Parameters<typeof cookieStore.set>[2];
        }>,
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll은 서버 컴포넌트에서 호출 시 실패할 수 있음.
          // 미들웨어에서 세션 갱신을 처리하므로 무시해도 됨.
        }
      },
    },
  });
}
