"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  Copy,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const KAKAO_LINK = "https://open.kakao.com/me/runhouse";

export default function CrewApprovalPendingPage() {
  const searchParams = useSearchParams();
  const crewName = searchParams.get("crew") || "";
  const email = searchParams.get("email") || "";

  const [approvalUrl, setApprovalUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function generateToken() {
      if (!email || !crewName) {
        setIsGenerating(false);
        return;
      }

      try {
        const res = await fetch("/api/crew-approval", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, crewName }),
        });
        const data = await res.json();
        if (data.approvalUrl) {
          setApprovalUrl(data.approvalUrl);
        }
      } catch (err) {
        console.error("토큰 생성 에러:", err);
      } finally {
        setIsGenerating(false);
      }
    }

    generateToken();
  }, [email, crewName]);

  const handleCopy = async () => {
    if (!approvalUrl) return;
    try {
      await navigator.clipboard.writeText(approvalUrl);
      setCopied(true);
      toast.success("링크가 복사되었습니다!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const kakaoMessage = `[RunHouse Custom 크루 인증 요청]\n\n크루: ${crewName}\n이메일: ${email}\n\n아래 링크에서 승인해주세요:\n${approvalUrl}`;

  const handleKakaoSend = () => {
    // 카카오톡 오픈채팅 링크로 이동 (메시지는 복사 후 전송)
    navigator.clipboard.writeText(kakaoMessage).then(() => {
      toast.success("메시지가 복사되었습니다! 카카오톡에 붙여넣기 해주세요.");
      window.open(KAKAO_LINK, "_blank");
    }).catch(() => {
      window.open(KAKAO_LINK, "_blank");
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          홈으로 돌아가기
        </Link>

        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              크루 인증 대기중
            </CardTitle>
            <CardDescription className="text-base">
              <span className="font-semibold text-black">{crewName}</span> 크루
              멤버 인증을 위해 관리자 승인이 필요합니다
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 안내 단계 */}
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">1. 회원가입 완료</p>
                  <p className="text-xs text-gray-500">
                    계정이 생성되었습니다
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    2. 아래 링크를 카카오톡으로 전송
                  </p>
                  <p className="text-xs text-gray-500">
                    RunHouse 관리자에게 승인 요청을 보내세요
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-gray-400">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-400">
                    3. 관리자 승인 후 10% 할인 활성화
                  </p>
                  <p className="text-xs text-gray-400">
                    승인 완료 시 자동으로 크루 혜택이 적용됩니다
                  </p>
                </div>
              </div>
            </div>

            {/* 승인 링크 */}
            {approvalUrl && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-gray-600">승인 요청 링크</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={approvalUrl}
                    className="flex-1 text-xs bg-white border rounded-md px-3 py-2 text-gray-600 truncate"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* 카카오톡 전송 버튼 */}
            <Button
              onClick={handleKakaoSend}
              disabled={isGenerating || !approvalUrl}
              className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-semibold h-12 text-base"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              카카오톡으로 승인 요청 보내기
            </Button>

            <p className="text-xs text-center text-gray-400">
              버튼을 누르면 메시지가 복사되고 카카오톡 채팅방이 열립니다.
              <br />
              복사된 메시지를 붙여넣기 해주세요.
            </p>

            {/* 하단 안내 */}
            <div className="border-t pt-4 space-y-2">
              <p className="text-xs text-gray-500 text-center">
                승인 전에도 일반 회원으로 서비스를 이용할 수 있습니다.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1" size="sm">
                  <Link href="/login">로그인하기</Link>
                </Button>
                <Button asChild variant="ghost" className="flex-1" size="sm">
                  <Link href="/">
                    쇼핑 시작
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
