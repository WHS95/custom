"use client";

/**
 * 내 제작 문의 (크루장)
 * 제작 심사 상태를 확인하고, 승인된 디자인을 상점에 등록한다.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Store } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";

interface ReviewItem {
  reviewId: string;
  productName: string;
  colorLabel: string;
  status: "pending" | "approved" | "rejected";
  factoryComment: string | null;
  note: string | null;
  attachmentCount: number;
  reviewedAt: string | null;
  registered: boolean;
  createdAt: string;
}

const STATUS_META: Record<
  ReviewItem["status"],
  { label: string; cls: string }
> = {
  pending: { label: "심사 중", cls: "bg-soft-cloud text-mute" },
  approved: { label: "제작 가능", cls: "bg-success/10 text-success" },
  rejected: { label: "제작 불가", cls: "bg-danger/10 text-danger" },
};

export default function ManufactureReviewsPage() {
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated, profile } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[] | null>(null);
  const [registering, setRegistering] = useState<string | null>(null);

  const isCrewStaff = profile?.user_type === "crew_staff";

  const load = useCallback(() => {
    fetch("/api/manufacture-reviews")
      .then((res) => res.json())
      .then((json) => setReviews(json.success ? json.data.reviews : []))
      .catch(() => setReviews([]));
  }, []);

  useEffect(() => {
    if (!authLoading && isCrewStaff) load();
  }, [authLoading, isCrewStaff, load]);

  const registerToStore = async (reviewId: string) => {
    setRegistering(reviewId);
    try {
      const res = await fetch("/api/store/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "등록 실패");
      toast.success("우리 크루 상점에 등록되었습니다!");
      router.push(`/store/${json.data.storeToken}/manage`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setRegistering(null);
    }
  };

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
        <p className="mt-2 text-sm text-muted-foreground">
          크루 계정으로 로그인해주세요.
        </p>
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
      <h1 className="text-xl font-bold">내 제작 문의</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        제작 가능 승인을 받으면 상점에 굿즈로 등록할 수 있어요.
      </p>

      <div className="mt-5 space-y-3">
        {reviews === null ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            불러오는 중...
          </p>
        ) : reviews.length === 0 ? (
          <div className="rounded-xl border border-hairline py-14 text-center text-sm text-muted-foreground">
            아직 제작 문의가 없어요.
            <br />
            스튜디오에서 디자인 후 &lsquo;제작 가능 여부 확인 요청&rsquo;을 눌러보세요.
          </div>
        ) : (
          reviews.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div
                key={r.reviewId}
                className="rounded-xl border border-hairline-soft p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{r.productName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {r.colorLabel} · 첨부 {r.attachmentCount}개 ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                </div>

                {r.factoryComment && (
                  <div className="mt-2 rounded-md bg-soft-cloud px-3 py-2 text-xs">
                    <span className="font-bold text-muted-foreground">공장 의견 </span>
                    {r.factoryComment}
                  </div>
                )}

                {r.status === "approved" &&
                  (r.registered ? (
                    <p className="mt-3 text-xs font-medium text-success">
                      ✓ 상점에 등록됨
                    </p>
                  ) : (
                    <Button
                      className="mt-3 h-10 w-full"
                      disabled={registering === r.reviewId}
                      onClick={() => registerToStore(r.reviewId)}
                    >
                      <Store className="mr-1.5 h-4 w-4" />
                      {registering === r.reviewId
                        ? "등록 중..."
                        : "우리 크루 상점에 등록"}
                    </Button>
                  ))}

                {r.status === "rejected" && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    디자인을 수정한 뒤 스튜디오에서 다시 문의해주세요.
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
