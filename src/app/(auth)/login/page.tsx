"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const SSO_ERROR_MESSAGES: Record<string, string> = {
  sso_missing_params: "SSO 파라미터가 누락되었습니다. 다시 시도해 주세요.",
  sso_state_mismatch: "보안 검증에 실패했습니다. 다시 시도해 주세요.",
  sso_token_invalid: "인증 토큰이 유효하지 않거나 만료되었습니다. 다시 시도해 주세요.",
  sso_account_error: "크루 계정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
};

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signIn } = useAuth();
  const redirectTo = searchParams.get("redirect") || "/";
  const errorKey = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const errorMessage =
    formError ??
    (errorKey ? (SSO_ERROR_MESSAGES[errorKey] ?? "로그인 중 오류가 발생했습니다.") : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!email.trim() || !password) {
      setFormError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setFormError("이메일 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.replace(redirectTo);
    } catch {
      setFormError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜드 패널 */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink items-center justify-center relative overflow-hidden">
        <div className="relative text-canvas text-center px-12 max-w-lg">
          <p className="text-kicker text-[#C7FF00] mb-6">· CREW IDENTITY ·</p>
          <h1 className="font-bold tracking-[0.08em] uppercase text-3xl mb-4">
            RUN HOUSE{" "}
            <span className="inline-block px-2 py-1 bg-[#C7FF00] text-[#0B0C0A] text-sm font-extrabold tracking-[0.15em] rounded-[4px] align-middle ml-1">
              CUSTOM
            </span>
          </h1>
          <p className="text-base text-stone leading-relaxed">
            나만의 러닝 크루 아이덴티티를 만들어보세요.
            <br />
            커스텀 모자부터 의류까지.
          </p>
        </div>
      </div>

      {/* 오른쪽 로그인 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-canvas">
        <div className="w-full max-w-md">
          {/* 모바일 브랜드 헤더 */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-block">
              <h1 className="font-bold tracking-[0.08em] uppercase text-xl">
                <span className="text-ink">RUN HOUSE</span>{" "}
                <span className="px-1.5 py-0.5 bg-[#C7FF00] text-[#0B0C0A] text-[9px] font-extrabold tracking-[0.15em] rounded-[4px] align-middle">
                  CUSTOM
                </span>
              </h1>
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center text-sm text-mute hover:text-ink mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            홈으로 돌아가기
          </Link>

          <Card className="border border-hairline">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold text-ink">크루 로그인</CardTitle>
              <CardDescription className="text-mute">
                이메일과 비밀번호로 로그인하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-[4px] bg-danger/10 border border-danger/20 text-sm text-danger">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-mute pt-1">
                  <Link href="/find-account" className="hover:text-ink underline underline-offset-2">
                    아이디 찾기
                  </Link>
                  <span className="text-hairline">·</span>
                  <Link href="/forgot-password" className="hover:text-ink underline underline-offset-2">
                    비밀번호 찾기
                  </Link>
                </div>
              </form>

              {/* 혜택 안내 */}
              <div className="rounded-[4px] border border-hairline bg-soft-cloud p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-ink">
                  <ShieldCheck className="w-4 h-4 text-[#C7FF00] flex-shrink-0" />
                  <span className="font-medium">크루 계정 혜택</span>
                </div>
                <ul className="space-y-1.5 text-sm text-mute pl-6">
                  <li>· 관리자 승인 시 10% 크루 할인</li>
                  <li>· 상점 개설·제작 문의는 가입 즉시</li>
                  <li>· 주문·디자인 이력 크루 계정에 귀속</li>
                </ul>
              </div>

              {/* 가입 안내 */}
              <p className="text-xs text-center text-mute pt-1">
                처음이신가요?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-ink underline underline-offset-2 hover:opacity-70 transition-opacity"
                >
                  크루 회원가입
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-mute" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
