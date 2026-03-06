"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Studio error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md">
        <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          스튜디오 로딩에 실패했습니다
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          상품 정보를 불러올 수 없습니다. 다시 시도하거나 목록으로 돌아가주세요.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/")}>
            상품 목록으로
          </Button>
          <Button onClick={reset}>다시 시도</Button>
        </div>
      </div>
    </div>
  );
}
