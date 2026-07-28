"use client";

/**
 * /find-account — 아이디(이메일) 찾기
 * 담당자명 + 연락처로 조회 → 마스킹된 이메일 표시.
 */
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, UserSearch } from "lucide-react";

export default function FindAccountPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMaskedEmail(null);
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      setError("이름과 연락처를 정확히 입력해 주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/find-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "조회에 실패했습니다.");
        return;
      }
      setMaskedEmail(data.maskedEmail);
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
            <CardTitle className="text-2xl font-bold text-ink">아이디 찾기</CardTitle>
            <CardDescription className="text-mute">
              가입 시 입력한 이름·연락처로 이메일을 찾아드려요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {maskedEmail ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 bg-[#C7FF00]/10 rounded-full flex items-center justify-center mx-auto">
                  <UserSearch className="w-7 h-7 text-[#C7FF00]" />
                </div>
                <p className="text-sm text-charcoal">가입된 이메일이에요</p>
                <p className="text-lg font-bold text-ink tracking-wide">{maskedEmail}</p>
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/forgot-password">비밀번호 찾기</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/login">로그인</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-[4px] bg-danger/10 border border-danger/20 text-sm text-danger">
                    {error}
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="name">담당자 이름</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">연락처</Label>
                  <PhoneInput id="phone" value={phone} onChange={setPhone} required />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Spinner className="w-4 h-4 mr-1.5" />
                      조회 중...
                    </>
                  ) : (
                    "이메일 찾기"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
