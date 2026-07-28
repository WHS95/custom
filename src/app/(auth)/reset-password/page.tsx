"use client";

/**
 * /reset-password?token=... — 새 비밀번호 설정
 * forgot-password 메일의 링크로 진입. 토큰 검증·비번 갱신은 /api/auth/reset-password.
 */
import { Suspense, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("유효하지 않은 접근입니다. 재설정 링크로 다시 진입해 주세요.");
      return;
    }
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "재설정에 실패했습니다.");
        return;
      }
      setDone(true);
    } catch {
      setError("재설정 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-canvas">
      <div className="w-full max-w-md">
        <Card className="border border-hairline">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-ink">새 비밀번호 설정</CardTitle>
            <CardDescription className="text-mute">
              새로 사용할 비밀번호를 입력해 주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <p className="text-sm text-charcoal">
                  비밀번호가 변경되었어요. 새 비밀번호로 로그인해 주세요.
                </p>
                <Button className="w-full" onClick={() => router.replace("/login")}>
                  로그인하기
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
                  <Label htmlFor="password">새 비밀번호 (6자 이상)</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">비밀번호 확인</Label>
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-1.5" />
                      변경 중...
                    </>
                  ) : (
                    "비밀번호 변경"
                  )}
                </Button>
                <p className="text-xs text-center text-mute pt-1">
                  <Link
                    href="/login"
                    className="font-medium text-ink underline underline-offset-2 hover:opacity-70"
                  >
                    로그인으로 돌아가기
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
