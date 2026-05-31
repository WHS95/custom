/**
 * SSO 크루 계정 upsert (서버 전용)
 *
 * user_profiles.user_id 는 customer_auth_users.id를 FK로 참조하므로,
 * SSO 크루에 대해 customer_auth_users에 stub 행을 upsert한 뒤
 * user_profiles을 upsert합니다.
 *
 * stub email 형식: sso-{instagram}@runhouse-sso.internal
 * stub password_hash: "sso-no-password" (bcrypt 불가능한 고정 문자열 — 직접 로그인 차단)
 */
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";
import {
  createSessionForUser,
  getAuthSessionByToken,
} from "@/lib/auth/server-auth";
import {
  AUTH_SESSION_COOKIE,
  getSessionCookieOptions,
} from "@/lib/auth/session";
import type { SsoTokenPayload } from "./types";

function ssoStubEmail(instagram: string): string {
  return `sso-${instagram}@runhouse-sso.internal`;
}

/**
 * SSO 크루 계정 upsert 후 session token/expiresAt을 반환
 */
export async function upsertCrewAccountAndCreateSession(
  payload: SsoTokenPayload,
): Promise<{ token: string; expiresAt: Date }> {
  const supabase = createServerSupabaseClient();
  const crewId = payload.sub;
  const stubEmail = ssoStubEmail(payload.instagram);

  // 1. customer_auth_users에 stub 행 upsert (id = crew_id 고정)
  //    Fix D-2: ignoreDuplicates:false + onConflict:"id" so email/fields stay
  //    authoritative for this crewId on every login.
  const { error: userError } = await supabase
    .from("customer_auth_users")
    .upsert(
      {
        id: crewId,
        email: stubEmail,
        password_hash: "sso-no-password",
      },
      { onConflict: "id", ignoreDuplicates: false },
    );

  if (userError) {
    throw new Error(`크루 계정 생성 실패: ${userError.message}`);
  }

  // 2. user_profiles upsert — crew_id 기준
  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: crewId,
        name: payload.crew_name,
        phone: "",
        user_type: "crew_staff",
        crew_name: payload.crew_name,
      },
      { onConflict: "user_id" },
    );

  if (profileError) {
    throw new Error(`크루 프로필 upsert 실패: ${profileError.message}`);
  }

  // 3. 기존 세션 메커니즘 재사용 — customer_auth_sessions에 토큰 발급
  const { token, expiresAt } = await createSessionForUser(crewId);

  return { token, expiresAt };
}

/**
 * AUTH_SESSION_COOKIE 옵션 export (callback route에서 사용)
 */
export { AUTH_SESSION_COOKIE, getSessionCookieOptions };

/**
 * 현재 쿠키 세션이 크루 SSO 계정인지 확인
 * Fix D-3: user_type === 'crew_staff' (user_profiles)으로 판별
 * (email suffix 문자열 매칭 대신 권한 필드 기준)
 */
export async function getCurrentCrewSsoSession(token: string) {
  const authState = await getAuthSessionByToken(token);
  if (!authState) return null;

  const supabase = createServerSupabaseClient();
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("user_type")
    .eq("user_id", authState.user.id)
    .maybeSingle();

  if (profileData?.user_type !== "crew_staff") return null;

  return authState;
}
