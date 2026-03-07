"use client";

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
import { Clock, CheckCircle2, ShoppingBag, Home } from "lucide-react";

export default function CrewApprovalPendingPage() {
  const searchParams = useSearchParams();
  const crewName = searchParams.get("crew") || "";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              크루 인증 대기중
            </CardTitle>
            {crewName && (
              <CardDescription className="text-base">
                <span className="font-semibold text-black">{crewName}</span> 크루
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  크루 인증 요청이 자동으로 전송되었습니다
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  관리자 확인 후 승인되면 자동으로 <span className="font-semibold">10% 할인</span>이 적용됩니다
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">
                  승인 전에도 일반 회원으로 서비스 이용 가능합니다
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="w-4 h-4 mr-1.5" />
                  홈으로
                </Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/">
                  <ShoppingBag className="w-4 h-4 mr-1.5" />
                  쇼핑 시작
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
