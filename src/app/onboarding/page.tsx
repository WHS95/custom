/**
 * /onboarding — 런하우스맵 SSO/Kakao OAuth 온보딩(맵 크루 검색)은 폐기됨.
 * 크루 가입은 이제 /signup 이메일 회원가입으로 일원화한다.
 * (맵 크루 검색 API /api/crews/search는 더 이상 호출되지 않음 — 후속 정리 예정)
 */
import { redirect } from "next/navigation";

export default function OnboardingPage() {
  redirect("/signup");
}
