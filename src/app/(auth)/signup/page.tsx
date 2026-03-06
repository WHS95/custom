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
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
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
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";

type UserType = "individual" | "crew_staff";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [crewName, setCrewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<{
    checked: boolean;
    available: boolean;
    message: string;
  } | null>(null);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email) {
        checkEmailAvailability(email);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [email, checkEmailAvailability]);

  const validateForm = () => {
    if (!email || !password || !passwordConfirm || !name) {
      toast.error("모든 필수 항목을 입력해주세요.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("올바른 이메일 형식이 아닙니다.");
      return false;
    }

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
      <div className="min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 to-black items-center justify-center" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜드 패널 (데스크탑) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-black items-center justify-center relative overflow-hidden sticky top-0 h-screen">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative text-white text-center px-12 max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            <span className="text-blue-400">RUN</span>HOUSE CUSTOM
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed mb-8">
            나만의 러닝 크루 아이덴티티를 만들어보세요.
          </p>
          <div className="space-y-4 text-left">
            {[
              "크루 로고를 직접 디자인",
              "다양한 색상과 스타일 선택",
              "대량 주문 시 할인 혜택",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-gray-300">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 폼 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* 모바일 브랜드 헤더 */}
          <div className="lg:hidden text-center mb-6">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-bold tracking-tighter">
                <span className="text-primary">RUN</span>HOUSE{" "}
                <span className="px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium align-middle">
                  CUSTOM
                </span>
              </h1>
            </Link>
          </div>

          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            홈으로 돌아가기
          </Link>

          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl font-bold">회원가입</CardTitle>
              <CardDescription>
                RunHouse Custom 멤버가 되어보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    이메일 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
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
                      autoComplete="email"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : emailCheckResult ? (
                        emailCheckResult.available ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )
                      ) : null}
                    </div>
                  </div>
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
                <div className="space-y-2">
                  <Label htmlFor="password">
                    비밀번호 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="6자 이상"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={password} />
                </div>

                {/* 비밀번호 확인 */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="passwordConfirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="비밀번호 다시 입력"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="pl-10 pr-10"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordConfirm && (
                    <p
                      className={`text-xs flex items-center gap-1 ${
                        password === passwordConfirm
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {password === passwordConfirm ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          비밀번호가 일치합니다
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          비밀번호가 일치하지 않습니다
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* 이름 */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    이름 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      autoComplete="name"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* 회원 유형 선택 */}
                <div className="space-y-3">
                  <Label>
                    회원 유형 <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType("individual")}
                      disabled={isLoading}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        userType === "individual"
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {userType === "individual" && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <User
                        className={`w-6 h-6 mb-2 ${
                          userType === "individual"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      />
                      <p className="font-medium text-sm">일반 개인</p>
                      <p className="text-xs text-gray-500 mt-1">
                        개인 고객으로 가입
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType("crew_staff")}
                      disabled={isLoading}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                        userType === "crew_staff"
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {userType === "crew_staff" && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <Users
                        className={`w-6 h-6 mb-2 ${
                          userType === "crew_staff"
                            ? "text-blue-600"
                            : "text-gray-500"
                        }`}
                      />
                      <p className="font-medium text-sm">러닝크루 운영진</p>
                      <p className="text-xs text-gray-500 mt-1">
                        크루 대표/운영진으로 가입
                      </p>
                    </button>
                  </div>
                </div>

                {/* 크루 이름 (운영진 선택 시) */}
                {userType === "crew_staff" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="crewName">
                      러닝크루 이름 <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="crewName"
                        type="text"
                        placeholder="예: 런하우스 러닝크루"
                        value={crewName}
                        onChange={(e) => setCrewName(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      소속된 러닝크루 이름을 입력해주세요
                    </p>
                  </div>
                )}

                {/* 회원가입 버튼 */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      가입 중...
                    </>
                  ) : (
                    "회원가입"
                  )}
                </Button>
              </form>

              {/* 로그인 링크 */}
              <div className="mt-6 text-center text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:underline font-medium"
                >
                  로그인
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
