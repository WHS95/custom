/**
 * 크루 검색 API
 *
 * GET /api/crews/search?q=런하우스
 * RunningCrewMap의 crews 테이블(public 스키마)에서 크루명 검색
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// public 스키마 전용 클라이언트 (RunningCrewMap 데이터 조회)
function getPublicSchemaClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    db: { schema: "public" },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 1) {
      return NextResponse.json({ crews: [] });
    }

    const supabase = getPublicSchemaClient();

    const { data, error } = await supabase
      .from("crews")
      .select("id, name, logo_image_url, instagram")
      .eq("is_visible", true)
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(10);

    if (error) {
      console.error("크루 검색 에러:", error);
      return NextResponse.json({ crews: [] });
    }

    return NextResponse.json(
      {
        crews: data.map((crew) => ({
          id: crew.id,
          name: crew.name,
          logoUrl: crew.logo_image_url,
          instagram: crew.instagram,
        })),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("크루 검색 에러:", error);
    return NextResponse.json({ crews: [] });
  }
}
