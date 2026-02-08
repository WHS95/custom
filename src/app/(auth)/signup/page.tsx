"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, SignUpParams } from "@/lib/auth/auth-context";
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
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Users,
  Building,
  Check,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type UserType = "individual" | "crew_staff";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();

  // 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [crewName, setCrewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 이메일 중복 체크 상태
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

  // 이메일 중복 체크 API 호출
  const checkEmailAvailability = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck)) {
      setEmailCheckResult(null);
      return;
    }

    setIsCheckingEmail(true);
    setEmailCheckResult(null);

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailCheckResult({
          checked: true,
          available: false,
          message: data.error || "이메일 확인 중 오류가 발생했습니다.",
        });
        return;
      }

      setEmailCheckResult({
        checked: true,
        available: data.available,
        message: data.available
          ? "사용 가능한 이메일입니다."
          : "이미 사용 중인 이메일입니다.",
      });
    } catch (error) {
      console.error("이메일 체크 에러:", error);
      setEmailCheckResult({
        checked: true,
        available: false,
        message: "이메일 확인 중 오류가 발생했습니다.",
      });
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // 이메일 입력 디바운스 (500ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email) {
        checkEmailAvailability(email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, checkEmailAvailability]);

  // 유효성 검사
  const validateForm = () => {
    if (!email || !password || !passwordConfirm || !name) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("올바른 이메일 형식이 아닙니다.");
      return false;
    }

    // 이메일 중복 체크 결과 확인
    if (emailCheckResult && !emailCheckResult.available) {
      toast.error("이미 사용 중인 이메일입니다.");
      return false;
    }

    if (password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return false;
    }

    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (userType === "crew_staff" && !crewName.trim()) {
      toast.error("러닝크루 이름을 입력해주세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const params: SignUpParams = {
        email,
        password,
        name,
        userType,
        crewName: userType === "crew_staff" ? crewName : undefined,
      };

      const { error } = await signUp(params);

      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("이미 가입된 이메일입니다.");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("회원가입이 완료되었습니다! 이메일 인증을 확인해주세요.");
      router.push("/login");
    } catch (error) {
      console.error("회원가입 에러:", error);
      toast.error("회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='w-8 h-8 animate-spin text-gray-400' />
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8'>
      <div className='w-full max-w-md'>
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl font-bold'>회원가입</CardTitle>
            <CardDescription>RunHouse Custom 멤버가 되어보세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              {/* 이메일 */}
              <div className='space-y-2'>
                <Label htmlFor='email'>
                  이메일 <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    placeholder='example@email.com'
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailCheckResult(null);
                    }}
                    className={`pl-10 pr-10 ${
                      emailCheckResult
                        ? emailCheckResult.available
                          ? "border-green-500 focus-visible:ring-green-500"
                          : "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                    autoComplete='email'
                    disabled={isLoading}
                  />
                  {/* 로딩 또는 체크 결과 아이콘 */}
                  <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                    {isCheckingEmail ? (
                      <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
                    ) : emailCheckResult ? (
                      emailCheckResult.available ? (
                        <CheckCircle2 className='w-4 h-4 text-green-500' />
                      ) : (
                        <AlertCircle className='w-4 h-4 text-red-500' />
                      )
                    ) : null}
                  </div>
                </div>
                {/* 이메일 체크 결과 메시지 */}
                {emailCheckResult && (
                  <p
                    className={`text-xs flex items-center gap-1 ${
                      emailCheckResult.available
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {emailCheckResult.message}
                  </p>
                )}
              </div>

              {/* 비밀번호 */}
              <div className='space-y-2'>
                <Label htmlFor='password'>
                  비밀번호 <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='password'
                    type='password'
                    placeholder='6자 이상'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='pl-10'
                    autoComplete='new-password'
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className='space-y-2'>
                <Label htmlFor='passwordConfirm'>
                  비밀번호 확인 <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='passwordConfirm'
                    type='password'
                    placeholder='비밀번호 다시 입력'
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className='pl-10'
                    autoComplete='new-password'
                    disabled={isLoading}
                  />
                </div>
                {passwordConfirm && (
                  <p
                    className={`text-xs ${
                      password === passwordConfirm
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {password === passwordConfirm
                      ? "비밀번호가 일치합니다"
                      : "비밀번호가 일치하지 않습니다"}
                  </p>
                )}
              </div>

              {/* 이름 */}
              <div className='space-y-2'>
                <Label htmlFor='name'>
                  이름 <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <Input
                    id='name'
                    type='text'
                    placeholder='홍길동'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='pl-10'
                    autoComplete='name'
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 회원 유형 선택 */}
              <div className='space-y-3'>
                <Label>
                  회원 유형 <span className='text-red-500'>*</span>
                </Label>
                <div className='grid grid-cols-2 gap-3'>
                  {/* 일반 개인 */}
                  <button
                    type='button'
                    onClick={() => setUserType("individual")}
                    disabled={isLoading}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      userType === "individual"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {userType === "individual" && (
                      <div className='absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    <User className='w-6 h-6 mb-2 text-gray-600' />
                    <p className='font-medium text-sm'>일반 개인</p>
                    <p className='text-xs text-gray-500 mt-1'>
                      개인 고객으로 가입
                    </p>
                  </button>

                  {/* 러닝크루 운영진 */}
                  <button
                    type='button'
                    onClick={() => setUserType("crew_staff")}
                    disabled={isLoading}
                    className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                      userType === "crew_staff"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {userType === "crew_staff" && (
                      <div className='absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center'>
                        <Check className='w-3 h-3 text-white' />
                      </div>
                    )}
                    <Users className='w-6 h-6 mb-2 text-gray-600' />
                    <p className='font-medium text-sm'>러닝크루 운영진</p>
                    <p className='text-xs text-gray-500 mt-1'>
                      크루 대표/운영진으로 가입
                    </p>
                  </button>
                </div>
              </div>

              {/* 크루 이름 (운영진 선택 시) */}
              {userType === "crew_staff" && (
                <div className='space-y-2 animate-in slide-in-from-top-2 duration-200'>
                  <Label htmlFor='crewName'>
                    러닝크루 이름 <span className='text-red-500'>*</span>
                  </Label>
                  <div className='relative'>
                    <Building className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                    <Input
                      id='crewName'
                      type='text'
                      placeholder='예: 런하우스 러닝크루'
                      value={crewName}
                      onChange={(e) => setCrewName(e.target.value)}
                      className='pl-10'
                      disabled={isLoading}
                    />
                  </div>
                  <p className='text-xs text-gray-500'>
                    소속된 러닝크루 이름을 입력해주세요
                  </p>
                </div>
              )}

              {/* 회원가입 버튼 */}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>

            {/* 로그인 링크 */}
            <div className='mt-6 text-center text-sm text-gray-600'>
              이미 계정이 있으신가요?{" "}
              <Link
                href='/login'
                className='text-blue-600 hover:underline font-medium'
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
