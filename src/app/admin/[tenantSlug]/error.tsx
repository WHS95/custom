"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          관리자 페이지 오류
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          데이터를 불러오는 중 문제가 발생했습니다.
        </p>
        <Button onClick={reset}>다시 시도</Button>
      </div>
    </div>
  );
}
