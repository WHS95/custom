"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
import { Separator } from "@/components/ui/separator";
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
  BadgeCheck,
  Search,
  MessageCircle,
} from "lucide-react";

interface CrewSearchResult {
  id: string;
  name: string;
  logoUrl: string | null;
  instagram: string | null;
}

type UserType = "individual" | "crew_staff";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithKakao, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [crewName, setCrewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 크루 검색 상태
  const [crewQuery, setCrewQuery] = useState("");
  const [crewResults, setCrewResults] = useState<CrewSearchResult[]>([]);
  const [isSearchingCrew, setIsSearchingCrew] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<CrewSearchResult | null>(null);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const crewDropdownRef = useRef<HTMLDivElement>(null);

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

  // 크루 검색 디바운스
  useEffect(() => {
    if (!crewQuery || crewQuery.length < 1 || selectedCrew) {
      setCrewResults([]);
      setShowCrewDropdown(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingCrew(true);
      try {
        const res = await fetch(`/api/crews/search?q=${encodeURIComponent(crewQuery)}`);
        const data = await res.json();
        setCrewResults(data.crews || []);
        setShowCrewDropdown((data.crews || []).length > 0);
      } catch {
        setCrewResults([]);
      } finally {
        setIsSearchingCrew(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [crewQuery, selectedCrew]);

  // 드롭다운 바깥 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (crewDropdownRef.current && !crewDropdownRef.current.contains(e.target as Node)) {
        setShowCrewDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCrew = (crew: CrewSearchResult) => {
    setSelectedCrew(crew);
    setCrewName(crew.name);
    setCrewQuery(crew.name);
    setShowCrewDropdown(false);
  };

  const handleClearCrew = () => {
    setSelectedCrew(null);
    setCrewName("");
    setCrewQuery("");
  };

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

    if (userType === "crew_staff" && !selectedCrew) {
      toast.error("등록된 러닝크루를 선택해주세요. 목록에서 크루를 검색하여 선택하세요.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // 크루 멤버는 crew_pending으로 가입 (관리자 승인 필요)
      const actualUserType = userType === "crew_staff" ? "crew_pending" : userType;

      const params: SignUpParams = {
        email,
        password,
        name,
        userType: actualUserType,
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

      if (userType === "crew_staff" && selectedCrew) {
        // 크루 멤버: 승인 대기 페이지로 이동
        toast.success("회원가입이 완료되었습니다! 크루 인증을 진행해주세요.");
        router.push(`/crew-approval/pending?crew=${encodeURIComponent(selectedCrew.name)}&email=${encodeURIComponent(email)}`);
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
              "등록 크루 회원 즉시 10% 할인",
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
                      <p className="font-medium text-sm">러닝크루 멤버</p>
                      <p className="text-xs text-gray-500 mt-1">
                        등록 크루 회원 10% 할인
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
                    <div className="relative" ref={crewDropdownRef}>
                      {selectedCrew ? (
                        // 선택된 크루 표시
                        <div className="flex items-center gap-3 p-2.5 rounded-md border border-green-300 bg-green-50">
                          {selectedCrew.logoUrl ? (
                            <Image
                              src={selectedCrew.logoUrl}
                              alt={selectedCrew.name}
                              width={28}
                              height={28}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <Building className="w-3.5 h-3.5 text-green-600" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{selectedCrew.name}</span>
                              <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearCrew}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                            disabled={isLoading}
                          >
                            변경
                          </button>
                        </div>
                      ) : (
                        // 검색 입력
                        <>
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            id="crewName"
                            type="text"
                            placeholder="크루 이름을 검색하세요"
                            value={crewQuery}
                            onChange={(e) => {
                              setCrewQuery(e.target.value);
                              setSelectedCrew(null);
                              setCrewName("");
                            }}
                            onFocus={() => {
                              if (crewResults.length > 0) setShowCrewDropdown(true);
                            }}
                            className="pl-10 pr-10"
                            disabled={isLoading}
                            autoComplete="off"
                          />
                          {isSearchingCrew && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                          )}
                        </>
                      )}

                      {/* 검색 결과 드롭다운 */}
                      {showCrewDropdown && crewResults.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {crewResults.map((crew) => (
                            <button
                              key={crew.id}
                              type="button"
                              onClick={() => handleSelectCrew(crew)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors"
                            >
                              {crew.logoUrl ? (
                                <Image
                                  src={crew.logoUrl}
                                  alt={crew.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                  <Building className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm font-medium truncate">{crew.name}</span>
                              <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0 ml-auto" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedCrew ? (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        등록된 크루입니다. 가입 즉시 10% 할인 혜택이 적용됩니다!
                      </p>
                    ) : crewQuery && !isSearchingCrew && crewResults.length === 0 ? (
                      <p className="text-xs text-amber-600">
                        검색 결과가 없습니다. RunHouse에 크루를 먼저 등록해주세요.
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500">
                        RunHouse에 등록된 러닝크루를 검색하세요
                      </p>
                    )}
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

              {/* 구분선 */}
              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
                  또는
                </span>
              </div>

              {/* 카카오 로그인 */}
              <Button
                type="button"
                variant="outline"
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] border-[#FEE500] text-[#3C1E1E] font-semibold h-11"
                onClick={async () => {
                  const { error } = await signInWithKakao();
                  if (error) {
                    toast.error("카카오 로그인에 실패했습니다.");
                  }
                }}
                disabled={isLoading}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                카카오로 시작하기
              </Button>

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
