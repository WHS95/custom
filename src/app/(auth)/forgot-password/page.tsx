"use client";

/**
 * /forgot-password — 비밀번호 찾기(재설정 메일 요청)
 * 이메일 입력 → 재설정 링크 메일 발송. 계정 존재 여부는 노출하지 않는다.
 */
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
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
import { ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "요청에 실패했습니다.");
        return;
      }
      setPreviewUrl(data.previewUrl ?? null);
      setSent(true);
    } catch {
      setError("요청 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-canvas">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-mute hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          로그인으로
        </Link>

        <Card className="border border-hairline">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-ink">비밀번호 찾기</CardTitle>
            <CardDescription className="text-mute">
              가입한 이메일로 재설정 링크를 보내드려요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 bg-[#C7FF00]/10 rounded-full flex items-center justify-center mx-auto">
                  <MailCheck className="w-7 h-7 text-[#C7FF00]" />
                </div>
                <p className="text-sm text-charcoal">
                  입력하신 이메일이 가입되어 있다면 재설정 링크를 보냈어요.
                  <br />
                  메일함(스팸함 포함)을 확인해 주세요.
                </p>
                {previewUrl && (
                  <div className="rounded-[4px] border border-hairline bg-soft-cloud p-3 text-left">
                    <p className="text-xs text-mute mb-1">개발 미리보기 링크</p>
                    <a
                      href={previewUrl}
                      className="text-xs text-ink underline break-all"
                    >
                      {previewUrl}
                    </a>
                  </div>
                )}
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">로그인으로 돌아가기</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-[4px] bg-danger/10 border border-danger/20 text-sm text-danger">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-1.5" />
                      전송 중...
                    </>
                  ) : (
                    "재설정 링크 받기"
                  )}
                </Button>
                <p className="text-xs text-center text-mute pt-1">
                  이메일이 기억나지 않나요?{" "}
                  <Link
                    href="/find-account"
                    className="font-medium text-ink underline underline-offset-2 hover:opacity-70"
                  >
                    아이디 찾기
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
