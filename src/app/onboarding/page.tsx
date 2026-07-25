"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
import { toast } from "sonner";
import posthog from "posthog-js";
import {
  Loader2,
  User,
  Users,
  Building,
  BadgeCheck,
  Search,
  CheckCircle2,
} from "lucide-react";

type UserType = "individual" | "crew_staff";

interface CrewSearchResult {
  id: string;
  name: string;
  logoUrl: string | null;
  instagram: string | null;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, refreshProfile } = useAuth();

  const [name, setName] = useState("");
  // 가입 = 크루 단일 트랙 (개인 유형은 피벗으로 제거, 기존 individual 계정은 유지)
  const [userType] = useState<UserType>("crew_staff");
  const [crewName, setCrewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 크루 검색
  const [crewQuery, setCrewQuery] = useState("");
  const [crewResults, setCrewResults] = useState<CrewSearchResult[]>([]);
  const [isSearchingCrew, setIsSearchingCrew] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<CrewSearchResult | null>(null);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const crewDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    } else if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
    } else if (user?.email) {
      setName(user.email.split("@")[0]);
    }
  }, [user]);

  // 비로그인 시 로그인 페이지로
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

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

  // 드롭다운 바깥 클릭 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (crewDropdownRef.current && !crewDropdownRef.current.contains(e.target as Node)) {
        setShowCrewDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCrew = useCallback((crew: CrewSearchResult) => {
    setSelectedCrew(crew);
    setCrewName(crew.name);
    setCrewQuery(crew.name);
    setShowCrewDropdown(false);

    // Cross-app identity: identify by Instagram handle when crew is known
    if (crew.instagram) {
      posthog.identify(crew.instagram, { crew_name: crew.name });
    }
  }, []);

  const handleClearCrew = useCallback(() => {
    setSelectedCrew(null);
    setCrewName("");
    setCrewQuery("");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    if (userType === "crew_staff" && !selectedCrew) {
      toast.error("등록된 러닝크루를 선택해주세요.");
      return;
    }

    if (!user) return;

    setIsSubmitting(true);

    try {
      const actualUserType = userType === "crew_staff" ? "crew_pending" : "individual";

      const response = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          userType: actualUserType,
          crewName: userType === "crew_staff" ? crewName : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "프로필 생성에 실패했습니다.");
        return;
      }

      await refreshProfile();

      if (userType === "crew_staff" && selectedCrew) {
        fetch("/api/crew-approval/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crewName: selectedCrew.name,
            userName: name.trim(),
            email: user.email || "",
          }),
        }).catch(() => {});

        toast.success("프로필이 생성되었습니다! 크루 인증 요청이 전송되었습니다.");
        router.push(
          `/crew-approval/pending?crew=${encodeURIComponent(selectedCrew.name)}`
        );
      } else {
        toast.success("환영합니다! 프로필이 생성되었습니다.");
        router.push("/");
      }
    } catch (error) {
      console.error("프로필 생성 에러:", error);
      toast.error("프로필 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-mute" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 브랜드 헤더 */}
        <div className="text-center mb-6">
          <h1 className="font-bold tracking-[0.08em] uppercase text-xl">
            <span className="text-ink">RUN HOUSE</span>{" "}
            <span className="px-1.5 py-0.5 bg-[#C7FF00] text-[#0B0C0A] text-[9px] font-extrabold tracking-[0.15em] rounded-[4px] align-middle">
              CUSTOM
            </span>
          </h1>
        </div>

        <Card className="border border-hairline">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-ink">프로필 설정</CardTitle>
            <CardDescription className="text-mute">
              서비스 이용을 위해 간단한 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 가입 = 크루 단일 트랙 (2026-07 피벗 — 일반 개인 유형 제거) */}
              <div className="rounded-[4px] border border-hairline bg-soft-cloud p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#C7FF00]" />
                  <p className="font-medium text-sm text-ink">러닝크루 계정</p>
                </div>
                <p className="mt-1 text-xs text-mute leading-relaxed">
                  RunHouse Custom 계정은 크루 운영진용이에요. 크루 상점의 굿즈
                  구매는 상점 링크에서 <b>가입 없이</b> 참여할 수 있습니다.
                </p>
              </div>

              {/* 크루 검색 */}
              {userType === "crew_staff" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label>
                    러닝크루 이름 <span className="text-danger">*</span>
                  </Label>
                  <div className="relative" ref={crewDropdownRef}>
                    {selectedCrew ? (
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
                            <span className="text-sm font-medium truncate">
                              {selectedCrew.name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-success flex-shrink-0" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearCrew}
                          className="text-xs text-mute hover:text-ink px-2 py-1 rounded-[4px] hover:bg-soft-cloud transition-colors"
                          disabled={isSubmitting}
                        >
                          변경
                        </button>
                      </div>
                    ) : (
                      <>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone" />
                        <Input
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
                          disabled={isSubmitting}
                          autoComplete="off"
                        />
                        {isSearchingCrew && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-stone" />
                        )}
                      </>
                    )}

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
                            <span className="text-sm font-medium truncate">
                              {crew.name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-[#C7FF00] flex-shrink-0 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCrew ? (
                    <p className="text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      등록된 크루입니다. 승인 후 10% 할인 혜택이 적용됩니다!
                    </p>
                  ) : crewQuery && !isSearchingCrew && crewResults.length === 0 ? (
                    <p className="text-xs text-[#C7FF00]">
                      검색 결과가 없습니다. 크루 등록은{" "}
                      <a
                        href="https://www.runhouse.club/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        runhouse.club/register
                      </a>
                      {" "}에서 신청해주세요.
                    </p>
                  ) : (
                    <p className="text-xs text-mute">
                      RunHouse에 등록된 러닝크루를 검색하세요
                    </p>
                  )}
                  <a
                    href="https://www.runhouse.club/register"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-ink underline underline-offset-4 mt-1 transition-colors"
                  >
                    우리 크루가 아직 등록되지 않았나요?
                    <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* 제출 */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    설정 중...
                  </>
                ) : (
                  "시작하기"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
