"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { EmailInput } from "@/components/ui/email-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { signIn, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("로그인되었습니다.");
      router.push(redirect);
    } catch (error) {
      console.error("로그인 에러:", error);
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-ink items-center justify-center" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜드 패널 — Cartographic Dark */}
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

      {/* 오른쪽 폼 영역 */}
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
              <CardTitle className="text-2xl font-bold text-ink">로그인</CardTitle>
              <CardDescription className="text-mute">
                RunHouse Custom에 오신 것을 환영합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                    <EmailInput
                      id="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={setEmail}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 비밀번호 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">비밀번호</Label>
                    <span className="text-sm text-stone">
                      비밀번호는 로그인 후 프로필에서 변경
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="비밀번호 입력"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 로그인 버튼 */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      로그인 중...
                    </>
                  ) : (
                    "로그인"
                  )}
                </Button>
              </form>
              {/* 회원가입 링크 */}
              <div className="mt-6 text-center text-sm text-mute">
                아직 계정이 없으신가요?{" "}
                <Link
                  href="/signup"
                  className="text-ink underline underline-offset-4 font-medium"
                >
                  회원가입
                </Link>
              </div>
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
      <LoginForm />
    </Suspense>
  );
}
