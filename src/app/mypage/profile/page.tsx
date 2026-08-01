"use client";

import { useState, useEffect, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, User, MapPin, Lock, Users, Building, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, profile, isLoading: authLoading, refreshProfile, updatePassword } = useAuth();

  // 폼 상태
  const [name, setName] = useState("");
  const [crewName, setCrewName] = useState("");
  const [crewIntro, setCrewIntro] = useState("");
  const [crewRegion, setCrewRegion] = useState("");
  const [crewLogoUrl, setCrewLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 배송지 상태
  const [address, setAddress] = useState({
    recipientName: "",
    phone: "",
    zipCode: "",
    address: "",
    addressDetail: "",
    memo: "",
  });

  // 비밀번호 변경 상태
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 프로필 데이터 로드
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCrewName(profile.crew_name || "");
      setCrewIntro(profile.crew_intro || "");
      setCrewRegion(profile.crew_region || "");
      setCrewLogoUrl(profile.crew_logo_url || null);
      if (profile.default_address) {
        setAddress({
          recipientName: profile.default_address.recipientName || "",
          phone: formatPhone(profile.default_address.phone || ""),
          zipCode: profile.default_address.zipCode || "",
          address: profile.default_address.address || "",
          addressDetail: profile.default_address.addressDetail || "",
          memo: profile.default_address.memo || "",
        });
      }
    }
  }, [profile]);

  // 전화번호 포맷팅
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, "");
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7)
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 프로필 저장
  const handleSaveProfile = async () => {
    if (!user || !profile) return;

    if (!name.trim()) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          crewName,
          crewIntro,
          crewRegion,
          defaultAddress: address.recipientName
            ? {
                recipientName: address.recipientName,
                phone: address.phone.replace(/-/g, ""),
                zipCode: address.zipCode,
                address: address.address,
                addressDetail: address.addressDetail,
                memo: address.memo,
              }
            : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "프로필 저장에 실패했습니다.");
      }

      await refreshProfile();
      toast.success("프로필이 저장되었습니다.");
    } catch (error) {
      console.error("프로필 저장 에러:", error);
      toast.error("프로필 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 크루 로고 업로드
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/auth/crew-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "업로드 실패");
      setCrewLogoUrl(data.data.url);
      await refreshProfile();
      toast.success("로고를 변경했어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  // 비밀번호 변경
  const handleChangePassword = async () => {
    if (!newPassword || !newPasswordConfirm) {
      toast.error("새 비밀번호를 입력해주세요.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await updatePassword(newPassword);

      if (error) {
        if (error.message.includes("different from the old password")) {
          toast.error("새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        } else {
          toast.error(error.message);
        }
        setIsChangingPassword(false);
        return;
      }

      toast.success("비밀번호가 변경되었습니다.");
      setNewPassword("");
      setNewPasswordConfirm("");
    } catch (error) {
      console.error("비밀번호 변경 에러:", error);
      toast.error("비밀번호 변경에 실패했습니다.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/mypage"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold">프로필 관리</h1>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                기본 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 이메일 (수정 불가) */}
              <div className="space-y-2">
                <Label>이메일</Label>
                <Input value={user.email || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">이메일은 변경할 수 없습니다</p>
              </div>

              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름 입력"
                />
              </div>

              {/* 회원 유형 */}
              <div className="space-y-2">
                <Label>회원 유형</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  {profile.user_type === "crew_staff" ? (
                    <>
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">러닝크루 운영진</span>
                    </>
                  ) : (
                    <>
                      <User className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">일반 개인</span>
                    </>
                  )}
                </div>
              </div>

              {/* 크루 정체성 (운영진만) — 상점 카드/둘러보기에 노출 */}
              {profile.user_type === "crew_staff" && (
                <div className="space-y-4 rounded-lg border border-hairline p-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    크루 소개 (상점·둘러보기 카드에 표시돼요)
                  </p>

                  {/* 로고 */}
                  <div className="flex items-center gap-3">
                    {crewLogoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={crewLogoUrl}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#C7FF00] text-lg font-black text-[#0B0C0A]">
                        {(crewName || "?").trim().charAt(0) || "?"}
                      </span>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoUploading ? "업로드 중..." : "로고 변경"}
                    </Button>
                  </div>

                  {/* 크루 이름 */}
                  <div className="space-y-2">
                    <Label htmlFor="crewName">러닝크루 이름</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="crewName"
                        value={crewName}
                        onChange={(e) => setCrewName(e.target.value)}
                        placeholder="러닝크루 이름"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* 활동지역 */}
                  <div className="space-y-2">
                    <Label htmlFor="crewRegion">활동지역</Label>
                    <Input
                      id="crewRegion"
                      value={crewRegion}
                      onChange={(e) => setCrewRegion(e.target.value)}
                      placeholder="예: 서울 · 한강"
                      maxLength={60}
                    />
                  </div>

                  {/* 소개글 */}
                  <div className="space-y-2">
                    <Label htmlFor="crewIntro">소개글</Label>
                    <Textarea
                      id="crewIntro"
                      value={crewIntro}
                      onChange={(e) => setCrewIntro(e.target.value)}
                      placeholder="우리 크루를 한 줄로 소개해 주세요."
                      rows={2}
                      maxLength={300}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 기본 배송지 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                기본 배송지
              </CardTitle>
              <CardDescription>
                주문 시 자동으로 입력됩니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">수령인</Label>
                  <Input
                    id="recipientName"
                    value={address.recipientName}
                    onChange={(e) =>
                      setAddress({ ...address, recipientName: e.target.value })
                    }
                    placeholder="수령인 이름"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientPhone">연락처</Label>
                  <Input
                    id="recipientPhone"
                    value={address.phone}
                    onChange={(e) =>
                      setAddress({ ...address, phone: formatPhone(e.target.value) })
                    }
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zipCode">우편번호</Label>
                <Input
                  id="zipCode"
                  value={address.zipCode}
                  onChange={(e) =>
                    setAddress({ ...address, zipCode: e.target.value })
                  }
                  placeholder="우편번호"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  value={address.address}
                  onChange={(e) =>
                    setAddress({ ...address, address: e.target.value })
                  }
                  placeholder="주소"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressDetail">상세주소</Label>
                <Input
                  id="addressDetail"
                  value={address.addressDetail}
                  onChange={(e) =>
                    setAddress({ ...address, addressDetail: e.target.value })
                  }
                  placeholder="상세주소"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="memo">배송 메모</Label>
                <Input
                  id="memo"
                  value={address.memo}
                  onChange={(e) =>
                    setAddress({ ...address, memo: e.target.value })
                  }
                  placeholder="예: 부재 시 경비실에 맡겨주세요"
                />
              </div>
            </CardContent>
          </Card>

          {/* 저장 버튼 */}
          <Button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                저장 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                프로필 저장
              </>
            )}
          </Button>

          <Separator />

          {/* 비밀번호 변경 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                비밀번호 변경
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6자 이상"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPasswordConfirm">새 비밀번호 확인</Label>
                <Input
                  id="newPasswordConfirm"
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                />
                {newPasswordConfirm && (
                  <p
                    className={`text-xs ${
                      newPassword === newPasswordConfirm
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    {newPassword === newPasswordConfirm
                      ? "비밀번호가 일치합니다"
                      : "비밀번호가 일치하지 않습니다"}
                  </p>
                )}
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                variant="outline"
                className="w-full"
              >
                {isChangingPassword ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    변경 중...
                  </>
                ) : (
                  "비밀번호 변경"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
