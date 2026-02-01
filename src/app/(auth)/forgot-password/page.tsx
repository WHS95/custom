"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("이메일을 입력해주세요.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("올바른 이메일 형식이 아닙니다.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        toast.error(error.message);
        return;
      }

      setIsEmailSent(true);
      toast.success("비밀번호 재설정 이메일이 발송되었습니다.");
    } catch (error) {
      console.error("비밀번호 재설정 에러:", error);
      toast.error("이메일 발송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">이메일을 확인해주세요</h2>
              <p className="text-gray-600 mb-6">
                <span className="font-medium">{email}</span>으로
                <br />
                비밀번호 재설정 링크를 발송했습니다.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
              </p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEmailSent(false)}
                >
                  다른 이메일로 재시도
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    로그인으로 돌아가기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 */}
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          로그인으로 돌아가기
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">비밀번호 찾기</CardTitle>
            <CardDescription>
              가입한 이메일로 비밀번호 재설정 링크를 보내드립니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 이메일 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="가입한 이메일 주소"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* 전송 버튼 */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    전송 중...
                  </>
                ) : (
                  "재설정 링크 받기"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
