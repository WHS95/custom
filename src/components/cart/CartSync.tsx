"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCartStore } from "@/lib/store/cart-store";

/**
 * CartSync 컴포넌트
 * 인증 상태 변경 시 장바구니를 DB와 동기화
 */
export function CartSync() {
  const { user, isLoading } = useAuth();
  const setUserId = useCartStore((state) => state.setUserId);

  useEffect(() => {
    if (isLoading) return;

    // 인증 상태에 따라 userId 설정
    setUserId(user?.id ?? null);
  }, [user, isLoading, setUserId]);

  // 렌더링하는 내용 없음
  return null;
}
