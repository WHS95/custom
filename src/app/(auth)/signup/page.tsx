/**
 * /signup — 이메일 회원가입 비활성화
 * 크루 SSO 로그인으로 리다이렉트합니다.
 */
import { redirect } from "next/navigation";

export default function SignupPage() {
  redirect("/login");
}
