"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Mail, Lock } from "lucide-react";
import { Suspense } from "react";

const REMEMBER_EMAIL_KEY = "runhouse_remember_email";
const SAVED_EMAIL_KEY = "runhouse_saved_email";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const { signIn, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // localStorage에서 저장된 이메일 불러오기
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY) === "true";
    if (remembered) {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY) || "";
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  // 이미 로그인된 경우 리다이렉트
  if (isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // 아이디 기억 처리
    if (rememberEmail) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, "true");
      localStorage.setItem(SAVED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
      } else {
        router.push(redirectTo);
      }
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <Card>
          <CardHeader className='text-center'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <span className='text-primary font-bold text-xl'>RUN</span>
              <span className='font-bold text-xl'>HOUSE</span>
              <span className='px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium'>
                CUSTOM
              </span>
            </div>
            <CardTitle className='text-xl'>로그인</CardTitle>
            <CardDescription>이메일과 비밀번호를 입력하세요</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200'>
                  {error}
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='email'>이메일</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='example@email.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='pl-10'
                    required
                    autoComplete='email'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>비밀번호</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='password'
                    type='password'
                    placeholder='비밀번호를 입력하세요'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='pl-10'
                    required
                    autoComplete='current-password'
                    minLength={6}
                  />
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <input
                  id='rememberEmail'
                  type='checkbox'
                  checked={rememberEmail}
                  onChange={(e) => setRememberEmail(e.target.checked)}
                  className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary'
                />
                <Label
                  htmlFor='rememberEmail'
                  className='text-sm text-gray-600 cursor-pointer select-none font-normal'
                >
                  아이디(이메일) 기억하기
                </Label>
              </div>

              <Button
                type='submit'
                className='w-full'
                size='lg'
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>

            <div className='mt-6 text-center text-sm text-gray-500'>
              계정이 없으신가요?{" "}
              <Link
                href={`/signup${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                className='text-primary font-medium hover:underline'
              >
                회원가입
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
