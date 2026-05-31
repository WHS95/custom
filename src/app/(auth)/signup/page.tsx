"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import type { SignUpParams } from "@/lib/auth/types";
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
  BadgeCheck,
  Search,
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
        toast.error(error.message);
        return;
      }

      if (userType === "crew_staff" && selectedCrew) {
        fetch("/api/crew-approval/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crewName: selectedCrew.name,
            userName: name.trim(),
            email,
          }),
        }).catch(() => {});

        // 크루 멤버: 승인 대기 페이지로 이동
        toast.success("회원가입이 완료되었습니다! 크루 인증을 진행해주세요.");
        router.push(`/crew-approval/pending?crew=${encodeURIComponent(selectedCrew.name)}&email=${encodeURIComponent(email)}`);
        return;
      }

      toast.success("회원가입이 완료되었습니다.");
      router.push("/");
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
        <div className="hidden lg:flex lg:w-1/2 bg-ink items-center justify-center" />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* 왼쪽 브랜드 패널 — Cartographic Dark */}
      <div className="hidden lg:flex lg:w-1/2 bg-ink items-center justify-center relative overflow-hidden sticky top-0 h-screen">
        <div className="relative text-canvas text-center px-12 max-w-lg">
          <p className="text-kicker text-[#C7FF00] mb-6">· JOIN THE CREW ·</p>
          <h1 className="font-bold tracking-[0.08em] uppercase text-3xl mb-4">
            RUN HOUSE{" "}
            <span className="inline-block px-2 py-1 bg-[#C7FF00] text-[#0B0C0A] text-sm font-extrabold tracking-[0.15em] rounded-[4px] align-middle ml-1">
              CUSTOM
            </span>
          </h1>
          <p className="text-base text-stone leading-relaxed mb-8">
            나만의 러닝 크루 아이덴티티를 만들어보세요.
          </p>
          <div className="space-y-4 text-left max-w-xs mx-auto">
            {[
              "크루 로고를 직접 디자인",
              "다양한 색상과 스타일 선택",
              "등록 크루 회원 즉시 10% 할인",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3 text-stone">
                <div className="w-6 h-6 rounded-[4px] bg-[#C7FF00]/10 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-[#C7FF00]" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽 폼 영역 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-canvas">
        <div className="w-full max-w-md">
          {/* 모바일 브랜드 헤더 */}
          <div className="lg:hidden text-center mb-6">
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
              <CardTitle className="text-2xl font-bold text-ink">회원가입</CardTitle>
              <CardDescription className="text-mute">
                RunHouse Custom 멤버가 되어보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 이메일 */}
                <div className="space-y-2">
                  <Label htmlFor="email">
                    이메일 <span className="text-danger">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                    <EmailInput
                      id="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(nextEmail) => {
                        setEmail(nextEmail);
                        setEmailCheckResult(null);
                      }}
                      className={`pl-10 pr-10 ${
                        emailCheckResult
                          ? emailCheckResult.available
                            ? "border-success focus-visible:ring-success"
                            : "border-danger focus-visible:ring-danger"
                          : ""
                      }`}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingEmail ? (
                        <Loader2 className="w-4 h-4 animate-spin text-stone" />
                      ) : emailCheckResult ? (
                        emailCheckResult.available ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-danger" />
                        )
                      ) : null}
                    </div>
                  </div>
                  {emailCheckResult && (
                    <p
                      className={`text-xs flex items-center gap-1 ${
                        emailCheckResult.available
                          ? "text-success"
                          : "text-danger"
                      }`}
                    >
                      {emailCheckResult.message}
                    </p>
                  )}
                </div>

                {/* 비밀번호 */}
                <div className="space-y-2">
                  <Label htmlFor="password">
                    비밀번호 <span className="text-danger">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
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
                  <PasswordStrengthIndicator password={password} />
                </div>

                {/* 비밀번호 확인 */}
                <div className="space-y-2">
                  <Label htmlFor="passwordConfirm">
                    비밀번호 확인 <span className="text-danger">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone hover:text-ink transition-colors"
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
                          ? "text-success"
                          : "text-danger"
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
                    이름 <span className="text-danger">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
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
                    회원 유형 <span className="text-danger">*</span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType("individual")}
                      disabled={isLoading}
                      className={`relative p-4 rounded-[4px] border text-left transition-all duration-200 ${
                        userType === "individual"
                          ? "border-ink bg-soft-cloud"
                          : "border-hairline hover:border-ink/30 hover:bg-soft-cloud"
                      }`}
                    >
                      {userType === "individual" && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-ink rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-canvas" />
                        </div>
                      )}
                      <User
                        className={`w-6 h-6 mb-2 ${
                          userType === "individual"
                            ? "text-ink"
                            : "text-mute"
                        }`}
                      />
                      <p className="font-medium text-sm text-ink">일반 개인</p>
                      <p className="text-xs text-mute mt-1">
                        개인 고객으로 가입
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setUserType("crew_staff")}
                      disabled={isLoading}
                      className={`relative p-4 rounded-[4px] border text-left transition-all duration-200 ${
                        userType === "crew_staff"
                          ? "border-ink bg-soft-cloud"
                          : "border-hairline hover:border-ink/30 hover:bg-soft-cloud"
                      }`}
                    >
                      {userType === "crew_staff" && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-ink rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-canvas" />
                        </div>
                      )}
                      <Users
                        className={`w-6 h-6 mb-2 ${
                          userType === "crew_staff"
                            ? "text-[#C7FF00]"
                            : "text-mute"
                        }`}
                      />
                      <p className="font-medium text-sm text-ink">러닝크루 멤버</p>
                      <p className="text-xs text-mute mt-1">
                        등록 크루 회원 10% 할인
                      </p>
                    </button>
                  </div>
                </div>

                {/* 크루 이름 (운영진 선택 시) */}
                {userType === "crew_staff" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <Label htmlFor="crewName">
                      러닝크루 이름 <span className="text-danger">*</span>
                    </Label>
                    <div className="relative" ref={crewDropdownRef}>
                      {selectedCrew ? (
                        // 선택된 크루 표시
                        <div className="flex items-center gap-3 p-2.5 rounded-[4px] border border-success bg-success/5">
                          {selectedCrew.logoUrl ? (
                            <Image
                              src={selectedCrew.logoUrl}
                              alt={selectedCrew.name}
                              width={28}
                              height={28}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                              <Building className="w-3.5 h-3.5 text-success" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">{selectedCrew.name}</span>
                              <BadgeCheck className="w-4 h-4 text-success flex-shrink-0" />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearCrew}
                            className="text-xs text-mute hover:text-ink px-2 py-1 rounded-[4px] hover:bg-soft-cloud transition-colors"
                            disabled={isLoading}
                          >
                            변경
                          </button>
                        </div>
                      ) : (
                        // 검색 입력
                        <>
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
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
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-stone" />
                          )}
                        </>
                      )}

                      {/* 검색 결과 드롭다운 */}
                      {showCrewDropdown && crewResults.length > 0 && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-canvas border border-hairline rounded-[4px] max-h-48 overflow-y-auto">
                          {crewResults.map((crew) => (
                            <button
                              key={crew.id}
                              type="button"
                              onClick={() => handleSelectCrew(crew)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-soft-cloud transition-colors"
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
                                <div className="w-6 h-6 rounded-full bg-soft-cloud flex items-center justify-center flex-shrink-0">
                                  <Building className="w-3 h-3 text-mute" />
                                </div>
                              )}
                              <span className="text-sm font-medium truncate">{crew.name}</span>
                              <BadgeCheck className="w-4 h-4 text-[#C7FF00] flex-shrink-0 ml-auto" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedCrew ? (
                      <p className="text-xs text-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        등록된 크루입니다. 가입 즉시 10% 할인 혜택이 적용됩니다!
                      </p>
                    ) : crewQuery && !isSearchingCrew && crewResults.length === 0 ? (
                      <p className="text-xs text-[#C7FF00]">
                        검색 결과가 없습니다. RunHouse에 크루를 먼저 등록해주세요.
                      </p>
                    ) : (
                      <p className="text-xs text-mute">
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
              {/* 로그인 링크 */}
              <div className="mt-6 text-center text-sm text-mute">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="text-ink underline underline-offset-4 font-medium"
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
