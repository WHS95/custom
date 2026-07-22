/**
 * 사이즈 취합 공용 헬퍼 (서버 전용)
 */

import { createServerSupabaseClient } from "@/infrastructure/supabase";
import type { Database } from "@/infrastructure/supabase/database.types";

export type SizeCollectionRow =
  Database["runhousecustom"]["Tables"]["size_collections"]["Row"];
export type SizeCollectionResponseRow =
  Database["runhousecustom"]["Tables"]["size_collection_responses"]["Row"];

/**
 * 취합의 허용 색상 목록 (빈 배열 = 전체 허용)
 */
export function getAllowedColors(collection: SizeCollectionRow): string[] {
  return Array.isArray(collection.allowed_colors)
    ? (collection.allowed_colors as string[])
    : [];
}

/**
 * 공유 토큰으로 취합 조회. DB 에러는 throw (없으면 null)
 */
export async function findCollectionByToken(
  token: string,
): Promise<SizeCollectionRow | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("size_collections")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    throw new Error(`취합 조회 실패: ${error.message}`);
  }
  return data;
}
