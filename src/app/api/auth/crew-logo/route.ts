/**
 * POST /api/auth/crew-logo — 크루 로고 업로드(운영진)
 * multipart: logo(File). 업로드 후 user_profiles.crew_logo_url 갱신, url 반환.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { uploadReviewAttachment } from "@/infrastructure/supabase/storage";
import {
  getCurrentAuthUser,
  getCurrentAuthUserProfile,
} from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    const profile = await getCurrentAuthUserProfile();
    if (!user || profile?.user_type !== "crew_staff") {
      return NextResponse.json(
        { error: "크루 운영진만 이용할 수 있습니다." },
        { status: 403 },
      );
    }

    const form = await request.formData();
    const logo = form.get("logo");
    if (!(logo instanceof File) || logo.size === 0) {
      return NextResponse.json({ error: "이미지를 선택해 주세요." }, { status: 400 });
    }
    const ext = logo.name.slice(logo.name.lastIndexOf(".")).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp", ".gif", ".heic"].includes(ext)) {
      return NextResponse.json(
        { error: "이미지 파일만 올릴 수 있어요." },
        { status: 400 },
      );
    }
    if (logo.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "로고는 5MB 이하여야 해요." },
        { status: 400 },
      );
    }

    const uploaded = await uploadReviewAttachment(
      logo,
      `crew-logo-${user.id}`,
      `logo${ext}`,
      true,
    );
    if (!uploaded) {
      return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
    }

    const supabase = createServerSupabaseClient();
    await supabase
      .from("user_profiles")
      .update({ crew_logo_url: uploaded.url })
      .eq("user_id", user.id);

    return NextResponse.json({ success: true, data: { url: uploaded.url } });
  } catch (error) {
    console.error("POST /api/auth/crew-logo error:", error);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
