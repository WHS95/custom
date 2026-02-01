"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword, session } = useAuth();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 세션이 없으면 (유효하지 않은 링크) 안내
  useEffect(() => {
    // 로딩 중이거나 성공 상태라면 리다이렉트 하지 않음
    if (isLoading || isSuccess) return;

    // Supabase가 URL 해시에서 세션을 복구할 시간을 줌
    const timer = setTimeout(() => {
      if (!session) {
        toast.error("유효하지 않거나 만료된 링크입니다.");
        router.push("/forgot-password");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [session, router, isLoading, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !passwordConfirm) {
      toast.error("비밀번호를 입력해주세요.");
      return;
    }

    if (password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);

    try {
      const { error} = await updatePassword(password);

      console.log("error", error);
      if (error) {
        toast.error(error.message);
        return;
      }

      setIsSuccess(true);
      toast.success("비밀번호가 변경되었습니다.");
    } catch (error) {
      console.error("비밀번호 변경 에러:", error);
      toast.error("비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">비밀번호 변경 완료</h2>
              <p className="text-gray-600 mb-6">
                새로운 비밀번호로 로그인할 수 있습니다.
              </p>
              <Link href="/login">
                <Button className="w-full">로그인하기</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">새 비밀번호 설정</CardTitle>
            <CardDescription>새로운 비밀번호를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 새 비밀번호 */}
              <div className="space-y-2">
                <Label htmlFor="password">새 비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="6자 이상"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="passwordConfirm"
                    type="password"
                    placeholder="비밀번호 다시 입력"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="pl-10"
                    autoComplete="new-password"
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

              {/* 변경 버튼 */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    변경 중...
                  </>
                ) : (
                  "비밀번호 변경"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
