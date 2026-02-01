"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Lock,
  Users,
  Building,
  Save,
} from "lucide-react";

export default function ProfilePage() {
  const { user, profile, isLoading: authLoading, refreshProfile, updatePassword } = useAuth();
  const supabase = getSupabaseBrowserClient();

  // 폼 상태
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [crewName, setCrewName] = useState("");
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
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 프로필 데이터 로드
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(formatPhone(profile.phone));
      setCrewName(profile.crew_name || "");
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

    if (!phone.trim()) {
      toast.error("전화번호를 입력해주세요.");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          name: name.trim(),
          phone: phone.replace(/-/g, ""),
          crew_name: profile.user_type === "crew_staff" ? crewName.trim() : null,
          default_address: address.recipientName
            ? {
                recipientName: address.recipientName,
                phone: address.phone.replace(/-/g, ""),
                zipCode: address.zipCode,
                address: address.address,
                addressDetail: address.addressDetail,
                memo: address.memo,
              }
            : null,
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
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
        toast.error(error.message);
        return;
      }

      toast.success("비밀번호가 변경되었습니다.");
      setCurrentPassword("");
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
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
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

              {/* 전화번호 */}
              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="010-1234-5678"
                    className="pl-10"
                  />
                </div>
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

              {/* 크루 이름 (운영진만) */}
              {profile.user_type === "crew_staff" && (
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                variant="outline"
                className="w-full"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
