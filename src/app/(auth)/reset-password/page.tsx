/**
 * /reset-password — 이메일 로그인 비활성화로 더 이상 사용하지 않음.
 * 크루 SSO 로그인으로 리다이렉트합니다.
 */
import { redirect } from "next/navigation";

export default function ResetPasswordPage() {
  redirect("/login");
}
