"use client";

import { useState } from "react";
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
import { Loader2, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";
  const { signUp, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  // 이미 로그인된 경우 리다이렉트
  if (isAuthenticated) {
    router.push(redirectTo);
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!formData.name.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const { error: signUpError } = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          phone: formData.phone,
        },
      );

      if (signUpError) {
        setError(signUpError);
      } else {
        setSignUpSuccess(true);
      }
    } catch {
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입 성공 화면
  if (signUpSuccess) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
        <div className='w-full max-w-md'>
          <Card>
            <CardHeader className='text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg
                  className='w-8 h-8 text-green-600'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <CardTitle className='text-xl'>회원가입 완료!</CardTitle>
              <CardDescription>
                회원가입이 완료되었습니다. 로그인하여 서비스를 이용해주세요.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <Button
                className='w-full'
                size='lg'
                onClick={() =>
                  router.push(
                    `/login${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
                  )
                }
              >
                로그인하기
              </Button>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push("/")}
              >
                홈으로 가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12'>
      <div className='w-full max-w-md'>
        {/* 뒤로가기 */}
        <div className='mb-6'>
          <Link
            href='/'
            className='inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition'
          >
            <ArrowLeft className='w-4 h-4 mr-1' />
            홈으로
          </Link>
        </div>

        <Card>
          <CardHeader className='text-center'>
            <div className='flex items-center justify-center gap-2 mb-2'>
              <span className='text-primary font-bold text-xl'>RUN</span>
              <span className='font-bold text-xl'>HOUSE</span>
              <span className='px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium'>
                CUSTOM
              </span>
            </div>
            <CardTitle className='text-xl'>회원가입</CardTitle>
            <CardDescription>
              회원가입 후 주문내역을 편리하게 관리하세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {error && (
                <div className='bg-red-50 text-red-600 text-sm rounded-lg p-3 border border-red-200'>
                  {error}
                </div>
              )}

              <div className='space-y-2'>
                <Label htmlFor='name'>이름 *</Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='name'
                    name='name'
                    type='text'
                    placeholder='홍길동'
                    value={formData.name}
                    onChange={handleChange}
                    className='pl-10'
                    required
                    autoComplete='name'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>이메일 *</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='example@email.com'
                    value={formData.email}
                    onChange={handleChange}
                    className='pl-10'
                    required
                    autoComplete='email'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>전화번호</Label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    placeholder='010-1234-5678'
                    value={formData.phone}
                    onChange={handleChange}
                    className='pl-10'
                    autoComplete='tel'
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password'>비밀번호 *</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='password'
                    name='password'
                    type='password'
                    placeholder='6자 이상'
                    value={formData.password}
                    onChange={handleChange}
                    className='pl-10'
                    required
                    autoComplete='new-password'
                    minLength={6}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='passwordConfirm'>비밀번호 확인 *</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='passwordConfirm'
                    name='passwordConfirm'
                    type='password'
                    placeholder='비밀번호를 다시 입력하세요'
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className='pl-10'
                    required
                    autoComplete='new-password'
                    minLength={6}
                  />
                </div>
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
                    가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>

            <div className='mt-6 text-center text-sm text-gray-500'>
              이미 계정이 있으신가요?{" "}
              <Link
                href={`/login${redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
                className='text-primary font-medium hover:underline'
              >
                로그인
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center'>
          <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
