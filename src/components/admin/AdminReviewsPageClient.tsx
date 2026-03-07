"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/lib/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReviewCard from "@/components/admin/reviews/ReviewCard";
import ReviewStatusFilter from "@/components/admin/reviews/ReviewStatusFilter";
import ReviewCreateDialog from "@/components/admin/reviews/ReviewCreateDialog";
import ReviewEditDialog from "@/components/admin/reviews/ReviewEditDialog";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Plus, MessageSquare } from "lucide-react";
import type { Review, ReviewStatus } from "@/domain/review/types";
import { REVIEW_STATUS_LABELS } from "@/domain/review/types";

interface AdminReviewsPageClientProps {
  tenantSlugParam: string;
  initialReviews: Review[];
}

export function AdminReviewsPageClient({
  tenantSlugParam,
  initialReviews,
}: AdminReviewsPageClientProps) {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    tenantSlug,
  } = useAdminAuth();

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const useInitialAllDataRef = useRef(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login");
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        router.push(`/admin/${tenantSlug}/reviews`);
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, router]);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ admin: "true" });
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/reviews?${params}`);
      const result = await response.json();

      if (result.success) {
        setReviews(result.data);
      } else {
        toast.error("후기 목록을 불러오는데 실패했습니다");
      }
    } catch (error) {
      console.error("Fetch reviews error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!isAuthenticated) return;

    if (statusFilter === "all" && useInitialAllDataRef.current) {
      useInitialAllDataRef.current = false;
      return;
    }

    fetchReviews();
  }, [isAuthenticated, fetchReviews, statusFilter]);

  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchReviews();
      } else {
        toast.error(result.error || "상태 변경에 실패했습니다");
      }
    } catch (error) {
      console.error("Status change error:", error);
      toast.error("오류가 발생했습니다");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (result.success) {
        toast.success("후기가 삭제되었습니다");
        fetchReviews();
      } else {
        toast.error(result.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Delete review error:", error);
      toast.error("오류가 발생했습니다");
    }
  };

  const handleToggleFeatured = async (review: Review) => {
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !review.isFeatured }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(
          review.isFeatured ? "대표 후기 해제됨" : "대표 후기로 설정됨",
        );
        fetchReviews();
      } else {
        toast.error(result.error || "변경에 실패했습니다");
      }
    } catch (error) {
      console.error("Toggle featured error:", error);
      toast.error("오류가 발생했습니다");
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className='container mx-auto py-8 flex items-center justify-center min-h-[400px]'>
        <div className='text-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto text-gray-400' />
          <p className='text-gray-500'>후기 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            onClick={() => router.push(`/admin/${tenantSlugParam}/dashboard`)}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold flex items-center gap-2'>
              <MessageSquare className='h-6 w-6' />
              후기 관리
            </h1>
            <p className='text-gray-500'>
              <span className='font-medium text-blue-600'>
                [{tenantSlugParam}]
              </span>{" "}
              고객 후기를 관리합니다.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          후기 작성
        </Button>
      </div>

      <ReviewStatusFilter
        statusFilter={statusFilter}
        onFilterChange={setStatusFilter}
        reviewCount={reviews.length}
      />

      {reviews.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center text-gray-500'>
            {statusFilter === "all"
              ? "등록된 후기가 없습니다"
              : `${REVIEW_STATUS_LABELS[statusFilter as ReviewStatus]} 상태의 후기가 없습니다`}
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onStatusChange={handleStatusChange}
              onToggleFeatured={handleToggleFeatured}
              onEdit={setEditingReview}
              onDelete={(r) => handleDelete(r.id)}
            />
          ))}
        </div>
      )}

      <ReviewCreateDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={fetchReviews}
      />

      <ReviewEditDialog
        review={editingReview}
        onOpenChange={() => setEditingReview(null)}
        onEdited={fetchReviews}
      />
    </div>
  );
}
