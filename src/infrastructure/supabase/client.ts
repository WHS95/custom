/**
 * Supabase 클라이언트 설정 (브라우저용)
 *
 * 스키마: runhousecustom
 */

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 스키마 이름
 */
export const SCHEMA_NAME = "runhousecustom";

/**
 * 브라우저용 Supabase 클라이언트 (싱글톤)
 * Auth 세션을 자동으로 관리
 */
let browserClient: ReturnType<
  typeof createBrowserClient<Database, "runhousecustom">
> | null = null;

export function getSupabaseBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  if (!browserClient) {
    browserClient = createBrowserClient<Database, "runhousecustom">(
      supabaseUrl,
      supabaseAnonKey,
      {
        db: {
          schema: SCHEMA_NAME,
        },
      }
    );
  }

  return browserClient;
}

/**
 * 레거시: 기존 클라이언트 (하위 호환성)
 */
type SupabaseClientWithSchema = ReturnType<
  typeof createClient<Database, "runhousecustom">
>;

let supabaseInstance: SupabaseClientWithSchema | null = null;

export function getSupabaseClient(): SupabaseClientWithSchema {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase 환경 변수가 설정되지 않았습니다.");
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database, "runhousecustom">(
      supabaseUrl,
      supabaseAnonKey,
      {
      db: {
        schema: SCHEMA_NAME,
      },
      }
    );
  }

  return supabaseInstance;
}

/**
 * 서버 사이드용 Service Role 클라이언트
 * RLS를 우회하여 관리자 작업 수행
 */
let serverSupabaseInstance: SupabaseClientWithSchema | null = null;

export function createServerSupabaseClient(): SupabaseClientWithSchema {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다."
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다."
    );
  }

  if (!serverSupabaseInstance) {
    serverSupabaseInstance = createClient<Database, "runhousecustom">(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        db: {
          schema: SCHEMA_NAME,
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return serverSupabaseInstance;
}

/**
 * 기본 클라이언트 (하위 호환성)
 */
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};
