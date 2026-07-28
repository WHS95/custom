"use client";

/**
 * /signup — 크루 이메일 회원가입
 *
 * 런하우스맵 SSO 연동을 끊고 자체 가입으로 전환.
 * 가입 즉시 크루 운영진(crew_staff)이 되어 상점·제작·알림 전체 기능을 쓸 수 있고,
 * 10% 할인가만 관리자 승인(discount_status) 대상이다.
 * 가입 시 크루맵 등록 여부(자가신고)가 Discord 운영자 채널로 전달된다.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [crewName, setCrewName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [mapRegistered, setMapRegistered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password || !name.trim() || !crewName.trim()) {
      toast.error("필수 항목을 모두 입력해 주세요.");
      return;
    }
    if (password.length < 6) {
      toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await signUp({
        email: email.trim(),
        password,
        name: name.trim(),
        userType: "crew_staff",
        crewName: crewName.trim(),
        instagram: instagram.trim() || undefined,
        runhouseMapRegistered: mapRegistered,
      });

      if (error) {
        toast.error(error.message || "회원가입에 실패했습니다.");
        return;
      }

      toast.success("가입 완료! 할인 승인 요청이 접수되었습니다.");
      router.push(`/crew-approval/pending?crew=${encodeURIComponent(crewName.trim())}`);
    } catch {
      toast.error("회원가입 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-canvas">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-mute hover:text-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          홈으로 돌아가기
        </Link>

        <Card className="border border-hairline">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-ink">크루 회원가입</CardTitle>
            <CardDescription className="text-mute">
              가입 즉시 상점 개설·제작 문의가 가능해요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">이메일 *</Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="password">비밀번호 * (6자 이상)</Label>
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
                <Label htmlFor="name">담당자 이름 *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="crewName">크루명 *</Label>
                <Input
                  id="crewName"
                  value={crewName}
                  onChange={(e) => setCrewName(e.target.value)}
                  placeholder="런하우스 크루"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="instagram">크루 인스타그램</Label>
                <Input
                  id="instagram"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@runhouse.crew"
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-[4px] border border-hairline bg-soft-cloud p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mapRegistered}
                  onChange={(e) => setMapRegistered(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#C7FF00]"
                />
                <span className="text-sm text-charcoal">
                  <span className="font-medium text-ink">런하우스크루맵</span>에 등록된 크루예요
                  <span className="block text-xs text-mute mt-0.5">
                    할인 승인 심사에 참고돼요 (선택)
                  </span>
                </span>
              </label>

              <div className="rounded-[4px] border border-hairline bg-soft-cloud p-3 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#C7FF00] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-mute leading-relaxed">
                  10% 크루 할인가는 관리자 승인 후 적용돼요. 승인 전에도 상점 개설·제작
                  문의·주문은 바로 가능해요.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  "가입하기"
                )}
              </Button>

              <p className="text-xs text-center text-mute pt-1">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/login"
                  className="font-medium text-ink underline underline-offset-2 hover:opacity-70"
                >
                  로그인
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
