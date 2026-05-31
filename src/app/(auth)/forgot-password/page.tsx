"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Lock, Loader2, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("올바른 이메일을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setPreviewUrl(null);

    try {
      const { error, meta } = (await resetPassword(email)) as {
        error: Error | null;
        meta?: { previewUrl?: string };
      };

      if (error) {
        toast.error(error.message);
        return;
      }

      setPreviewUrl(meta?.previewUrl ?? null);
      setIsSubmitted(true);
      toast.success("비밀번호 재설정 링크를 준비했습니다.");
    } catch (error) {
      console.error("비밀번호 재설정 요청 에러:", error);
      toast.error("비밀번호 재설정 요청에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md">
          <Card className="border border-hairline">
            <CardContent className="space-y-4 pt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink">재설정 링크가 준비되었습니다</h2>
                <p className="mt-2 text-sm text-mute">
                  등록된 이메일이 있으면 비밀번호 재설정 링크를 보냈습니다.
                </p>
              </div>
              {previewUrl ? (
                <div className="rounded-[4px] border border-hairline bg-soft-cloud p-3 text-left text-sm">
                  <div className="mb-1 font-medium text-ink">개발용 미리보기 링크</div>
                  <a
                    href={previewUrl}
                    className="break-all text-ink underline underline-offset-4"
                  >
                    {previewUrl}
                  </a>
                </div>
              ) : null}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setPreviewUrl(null);
                  }}
                >
                  다시 요청
                </Button>
                <Link href="/login">
                  <Button className="w-full">로그인으로 이동</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        {/* 뒤로가기 */}
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-mute hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          로그인으로 돌아가기
        </Link>

        <Card className="border border-hairline">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-ink">비밀번호 찾기</CardTitle>
            <CardDescription className="text-mute">
              가입한 이메일로 재설정 링크를 발급합니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="가입한 이메일"
                    className="pl-10"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="rounded-[4px] border border-hairline bg-soft-cloud p-4 text-sm text-mute">
                <div className="mb-2 flex items-center gap-2 font-medium text-ink">
                  <Lock className="h-4 w-4" />
                  현재 동작 방식
                </div>
                메일 인프라가 연결되면 실제 메일로 발송되고, 지금은 개발 환경에서 재설정 링크를 화면에 보여줍니다.
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    링크 생성 중...
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
