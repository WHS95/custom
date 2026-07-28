"use client";

/**
 * 알림 센터 (크루 운영진)
 * 제작 승인/반려 + 내 상점 신규 주문을 한곳에서 확인.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  BellOff,
  BadgePercent,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { markNotificationsSeen } from "@/lib/notifications";

interface NotificationItem {
  id: string;
  type:
    | "review_approved"
    | "review_rejected"
    | "store_order"
    | "discount_approved"
    | "discount_rejected";
  title: string;
  description: string;
  createdAt: string;
  href: string;
}

const ICON = {
  review_approved: { Icon: CheckCircle2, cls: "text-green-600 bg-green-50" },
  review_rejected: { Icon: XCircle, cls: "text-red-600 bg-red-50" },
  store_order: { Icon: ShoppingBag, cls: "text-ink bg-soft-cloud" },
  discount_approved: { Icon: BadgePercent, cls: "text-green-700 bg-green-50" },
  discount_rejected: { Icon: XCircle, cls: "text-red-600 bg-red-50" },
} as const;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}

export default function NotificationsPage() {
  const { isLoading: authLoading, isAuthenticated, profile } = useAuth();
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const isCrewStaff = profile?.user_type === "crew_staff";

  const load = useCallback(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => setItems(json.success ? json.data.items : []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!authLoading && isCrewStaff) {
      load();
      // 이 화면을 열면 모두 읽음 처리
      markNotificationsSeen();
    }
  }, [authLoading, isCrewStaff, load]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }
  if (!isAuthenticated || !isCrewStaff) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-medium">크루 운영진 전용</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">크루 로그인</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link
        href="/"
        className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" /> 스튜디오
      </Link>
      <h1 className="text-xl font-bold">알림</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        제작 승인·반려와 우리 상점 신규 주문을 모아서 보여줘요.
      </p>

      <div className="mt-5 space-y-2">
        {items === null ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            불러오는 중...
          </p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-hairline py-14 text-center text-sm text-muted-foreground">
            <BellOff className="mx-auto mb-2 h-8 w-8 text-hairline" />
            아직 알림이 없어요.
          </div>
        ) : (
          items.map((n) => {
            const { Icon, cls } = ICON[n.type];
            return (
              <Link
                key={n.id}
                href={n.href}
                className="flex items-start gap-3 rounded-xl border border-hairline-soft p-3.5 transition-colors hover:bg-soft-cloud"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cls}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {n.description}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
