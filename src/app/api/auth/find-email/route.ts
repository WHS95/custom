/**
 * POST /api/auth/find-email — 아이디(이메일) 찾기
 * 가입 시 받은 담당자명 + 연락처(휴대폰)로 조회 → 마스킹된 이메일 반환.
 * 로그인이 이메일 기준이라 "아이디 = 이메일". 이메일을 모르는 사용자를 위한 복구 경로.
 * SSO 스텁 계정(@runhouse-sso.internal)·연락처 미보유 계정은 대상 아님.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";

/** 이메일 마스킹: ab***@gmail.com */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}

const onlyDigits = (s: string) => s.replace(/\D/g, "");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phoneDigits = onlyDigits(typeof body.phone === "string" ? body.phone : "");

    if (!name || phoneDigits.length < 10) {
      return NextResponse.json(
        { error: "이름과 연락처를 정확히 입력해 주세요." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();

    // 이름 일치 프로필 조회 후 연락처(숫자 정규화)로 대조
    const { data: profiles, error } = await supabase
      .from("user_profiles")
      .select("user_id, phone")
      .eq("name", name);

    if (error) throw error;

    const matched = (profiles || []).find(
      (p) => p.phone && onlyDigits(p.phone) === phoneDigits,
    );

    if (!matched) {
      return NextResponse.json(
        { error: "일치하는 계정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const { data: authUser, error: userError } = await supabase
      .from("customer_auth_users")
      .select("email")
      .eq("id", matched.user_id)
      .maybeSingle();

    if (userError) throw userError;

    const email = authUser?.email ?? "";
    // SSO 스텁 이메일은 복구 대상 아님
    if (!email || email.toLowerCase().endsWith("@runhouse-sso.internal")) {
      return NextResponse.json(
        { error: "일치하는 계정을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, maskedEmail: maskEmail(email) });
  } catch (err) {
    console.error("아이디 찾기 에러:", err);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
