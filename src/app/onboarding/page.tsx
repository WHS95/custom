"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
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
  User,
  Users,
  Building,
  Check,
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
  const supabase = getSupabaseBrowserClient();

  const [name, setName] = useState("");
  const [userType, setUserType] = useState<UserType>("individual");
  const [crewName, setCrewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 크루 검색
  const [crewQuery, setCrewQuery] = useState("");
  const [crewResults, setCrewResults] = useState<CrewSearchResult[]>([]);
  const [isSearchingCrew, setIsSearchingCrew] = useState(false);
  const [selectedCrew, setSelectedCrew] = useState<CrewSearchResult | null>(null);
  const [showCrewDropdown, setShowCrewDropdown] = useState(false);
  const crewDropdownRef = useRef<HTMLDivElement>(null);

  // 카카오에서 가져온 이름 자동 채우기
  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    } else if (user?.user_metadata?.name) {
      setName(user.user_metadata.name);
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

      const { error } = await supabase
        .schema("runhousecustom")
        .from("user_profiles")
        .insert({
          user_id: user.id,
          name: name.trim(),
          phone: "",
          user_type: actualUserType,
          crew_name: userType === "crew_staff" ? crewName : null,
        });

      if (error) {
        console.error("프로필 생성 에러:", error);
        toast.error("프로필 생성에 실패했습니다.");
        return;
      }

      await refreshProfile();

      if (userType === "crew_staff" && selectedCrew) {
        toast.success("프로필이 생성되었습니다! 크루 인증을 진행해주세요.");
        router.push(
          `/crew-approval/pending?crew=${encodeURIComponent(selectedCrew.name)}&email=${encodeURIComponent(user.email || "")}`
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* 브랜드 헤더 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tighter">
            <span className="text-primary">RUN</span>HOUSE{" "}
            <span className="px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium align-middle">
              CUSTOM
            </span>
          </h1>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">프로필 설정</CardTitle>
            <CardDescription>
              서비스 이용을 위해 간단한 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 회원 유형 */}
              <div className="space-y-3">
                <Label>회원 유형</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("individual")}
                    disabled={isSubmitting}
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
                        userType === "individual" ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <p className="font-medium text-sm">일반 개인</p>
                    <p className="text-xs text-gray-500 mt-1">개인 고객으로 이용</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserType("crew_staff")}
                    disabled={isSubmitting}
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
                        userType === "crew_staff" ? "text-blue-600" : "text-gray-500"
                      }`}
                    />
                    <p className="font-medium text-sm">러닝크루 멤버</p>
                    <p className="text-xs text-gray-500 mt-1">
                      등록 크루 회원 10% 할인
                    </p>
                  </button>
                </div>
              </div>

              {/* 크루 검색 (크루 멤버 선택 시) */}
              {userType === "crew_staff" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <Label>
                    러닝크루 이름 <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative" ref={crewDropdownRef}>
                    {selectedCrew ? (
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
                            <span className="text-sm font-medium truncate">
                              {selectedCrew.name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearCrew}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                          disabled={isSubmitting}
                        >
                          변경
                        </button>
                      </div>
                    ) : (
                      <>
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                        )}
                      </>
                    )}

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
                            <span className="text-sm font-medium truncate">
                              {crew.name}
                            </span>
                            <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCrew ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      등록된 크루입니다. 승인 후 10% 할인 혜택이 적용됩니다!
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
