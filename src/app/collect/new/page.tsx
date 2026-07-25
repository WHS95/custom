import { redirect } from "next/navigation";

/**
 * 독립 취합 생성기는 크루 상점으로 흡수됨 (2026-07 피벗).
 * 굿즈 등록 = 취합 생성이므로 홈(스튜디오 진입)으로 안내한다.
 * 기존 발행된 /collect/{token} 링크·manage는 그대로 동작한다.
 */
export default function CollectNewRedirect() {
  redirect("/");
}
