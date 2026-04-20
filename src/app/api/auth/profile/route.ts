import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";
import { getCurrentAuthUser, getCurrentAuthUserProfile } from "@/lib/auth/server-auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const userType =
      body.userType === "crew_pending" ||
      body.userType === "crew_staff" ||
      body.userType === "individual"
        ? body.userType
        : "individual";
    const crewName =
      typeof body.crewName === "string" && body.crewName.trim()
        ? body.crewName.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        name,
        phone: "",
        user_type: userType,
        crew_name: crewName,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("프로필 생성 에러:", error);
    return NextResponse.json(
      { error: "프로필 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentAuthUser();
    const profile = await getCurrentAuthUserProfile();

    if (!user || !profile) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const crewName =
      typeof body.crewName === "string" && body.crewName.trim()
        ? body.crewName.trim()
        : null;

    if (!name) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    const defaultAddress = body.defaultAddress ?? null;
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("user_profiles")
      .update({
        name,
        crew_name: profile.user_type === "crew_staff" ? crewName : null,
        default_address: defaultAddress,
      })
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("프로필 수정 에러:", error);
    return NextResponse.json(
      { error: "프로필 수정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
