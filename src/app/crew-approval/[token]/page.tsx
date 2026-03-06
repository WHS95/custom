"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  CheckCircle2,
  XCircle,
  Users,
  Mail,
  Calendar,
  Loader2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

interface ApprovalInfo {
  valid: boolean;
  email: string;
  crewName: string;
  requestedAt: string;
  profile: {
    id: string;
    name: string;
    userType: string;
    crewName: string;
    createdAt: string;
  } | null;
}

type PageState = "loading" | "ready" | "approved" | "rejected" | "error" | "already_done";

export default function CrewApprovalPage() {
  const params = useParams();
  const token = params.token as string;

  const [state, setState] = useState<PageState>("loading");
  const [info, setInfo] = useState<ApprovalInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/crew-approval?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (!res.ok || !data.valid) {
          setErrorMsg(data.error || "유효하지 않은 링크입니다.");
          setState("error");
          return;
        }

        setInfo(data);

        // 이미 승인된 경우
        if (data.profile?.userType === "crew_staff") {
          setState("already_done");
          return;
        }

        setState("ready");
      } catch {
        setErrorMsg("링크 확인 중 오류가 발생했습니다.");
        setState("error");
      }
    }

    if (token) verify();
  }, [token]);

  const handleAction = async (action: "approve" | "reject") => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/crew-approval", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "처리에 실패했습니다.");
        setState("error");
        return;
      }

      setState(action === "approve" ? "approved" : "rejected");
    } catch {
      setErrorMsg("처리 중 오류가 발생했습니다.");
      setState("error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          홈으로
        </Link>

        {/* 로딩 */}
        {state === "loading" && (
          <Card className="shadow-lg border-0">
            <CardContent className="py-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">승인 요청을 확인하는 중...</p>
            </CardContent>
          </Card>
        )}

        {/* 에러 */}
        {state === "error" && (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">링크 오류</h2>
              <p className="text-gray-500 mb-6">{errorMsg}</p>
              <Button asChild variant="outline">
                <Link href="/">홈으로 돌아가기</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 이미 처리됨 */}
        {state === "already_done" && info && (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">이미 승인됨</h2>
              <p className="text-gray-500">
                <span className="font-medium">{info.crewName}</span> 크루 멤버가 이미 승인되었습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 승인 대기 - 관리자 결정 */}
        {state === "ready" && info && (
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-bold">
                크루 멤버 승인 요청
              </CardTitle>
              <CardDescription>
                아래 사용자의 크루 멤버 인증을 승인하시겠습니까?
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 요청 정보 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">크루</p>
                    <p className="font-semibold">{info.crewName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">이메일</p>
                    <p className="font-medium text-sm">{info.email}</p>
                  </div>
                </div>
                {info.profile && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">이름 / 가입일</p>
                      <p className="font-medium text-sm">
                        {info.profile.name} /{" "}
                        {new Date(info.profile.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* 승인 시 혜택 안내 */}
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700">
                  승인 시 <span className="font-bold">10% 즉시 할인</span> 혜택이 부여됩니다
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3">
                <Button
                  onClick={() => handleAction("reject")}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-1" />
                      거절
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleAction("approve")}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      승인
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 승인 완료 */}
        {state === "approved" && info && (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-green-700">
                승인 완료!
              </h2>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">{info.crewName}</span> 크루 멤버가
              </p>
              <p className="text-gray-600 mb-4">
                성공적으로 승인되었습니다.
              </p>
              <p className="text-sm text-gray-500">
                해당 회원은 이제 10% 할인 혜택을 받을 수 있습니다.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 거절 완료 */}
        {state === "rejected" && info && (
          <Card className="shadow-lg border-0">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-gray-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">거절됨</h2>
              <p className="text-gray-500">
                크루 멤버 요청이 거절되었습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
