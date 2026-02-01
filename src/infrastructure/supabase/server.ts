/**
 * Supabase 서버 클라이언트 설정
 *
 * Next.js App Router의 서버 컴포넌트, API Route, Server Actions에서 사용
 * 쿠키 기반 세션 관리
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { SCHEMA_NAME } from "./client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 서버 컴포넌트 / API Route에서 사용하는 Supabase 클라이언트
 * 사용자 세션을 자동으로 읽어옴
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: SCHEMA_NAME,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 서버 컴포넌트에서 호출된 경우 무시
          // 미들웨어나 Route Handler에서만 쿠키 설정 가능
        }
      },
    },
  });
}

/**
 * API Route에서 쿠키 설정이 필요한 경우 사용
 * (로그인, 로그아웃 등)
 */
export async function getSupabaseRouteClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: SCHEMA_NAME,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

/**
 * 현재 로그인한 사용자 정보 가져오기
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 현재 로그인한 사용자의 프로필 정보 가져오기
 */
export async function getCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = await getSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    console.error("프로필 조회 에러:", error);
    return null;
  }

  return profile;
}
