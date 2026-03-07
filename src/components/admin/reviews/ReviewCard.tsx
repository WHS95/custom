"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Check,
  X,
  Trash2,
  Edit,
  Crown,
} from "lucide-react";
import type { Review, ReviewStatus } from "@/domain/review/types";
import {
  REVIEW_STATUS_LABELS,
  AUTHOR_TYPE_LABELS,
} from "@/domain/review/types";

export interface ReviewCardProps {
  review: Review;
  onStatusChange: (reviewId: string, status: ReviewStatus) => void;
  onToggleFeatured: (review: Review) => void;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
}

const getStatusBadgeClass = (status: ReviewStatus) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ReviewCard({
  review,
  onStatusChange,
  onToggleFeatured,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  return (
    <Card className={review.isFeatured ? "border-yellow-400 border-2" : ""}>
      <CardContent className='py-4'>
        <div className='flex justify-between items-start'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-2'>
              {review.isFeatured && (
                <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                  <Crown className='h-3 w-3' />
                  대표
                </span>
              )}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                  review.status,
                )}`}
              >
                {REVIEW_STATUS_LABELS[review.status]}
              </span>
              <span className='text-xs text-gray-500'>
                {AUTHOR_TYPE_LABELS[review.authorType]}
              </span>
              <span className='text-xs text-gray-400'>
                {new Date(review.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>

            <div className='flex items-center gap-2 mb-1'>
              <span className='font-medium'>{review.authorName}</span>
              {review.organizationName && (
                <span className='text-sm text-gray-500'>
                  ({review.organizationName})
                </span>
              )}
              <div className='flex items-center text-yellow-500'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-current"
                        : "stroke-current fill-none"
                    }`}
                  />
                ))}
              </div>
            </div>

            {review.title && (
              <h4 className='font-medium text-gray-800 mb-1'>
                {review.title}
              </h4>
            )}
            <p className='text-gray-600 text-sm whitespace-pre-wrap'>
              {review.content}
            </p>

            {review.images.length > 0 && (
              <div className='flex gap-2 mt-2'>
                {review.images.map((img, idx) => (
                  <div
                    key={idx}
                    className='w-16 h-16 rounded border overflow-hidden'
                  >
                    <img
                      src={img.url}
                      alt={img.caption || `이미지 ${idx + 1}`}
                      className='w-full h-full object-cover'
                    />
                  </div>
                ))}
              </div>
            )}

            {review.adminMemo && (
              <div className='mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600'>
                <span className='font-medium'>관리자 메모:</span>{" "}
                {review.adminMemo}
              </div>
            )}
          </div>

          <div className='flex flex-col gap-2 ml-4'>
            {review.status === "pending" && (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  className='text-green-600 hover:text-green-700'
                  onClick={() => onStatusChange(review.id, "approved")}
                >
                  <Check className='h-4 w-4 mr-1' />
                  승인
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='text-red-600 hover:text-red-700'
                  onClick={() => onStatusChange(review.id, "rejected")}
                >
                  <X className='h-4 w-4 mr-1' />
                  거절
                </Button>
              </>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => onToggleFeatured(review)}
            >
              <Crown
                className={`h-4 w-4 mr-1 ${
                  review.isFeatured
                    ? "fill-yellow-400 text-yellow-400"
                    : ""
                }`}
              />
              {review.isFeatured ? "해제" : "대표"}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onEdit(review)}
            >
              <Edit className='h-4 w-4 mr-1' />
              수정
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='text-red-600 hover:text-red-700'
              onClick={() => onDelete(review)}
            >
              <Trash2 className='h-4 w-4 mr-1' />
              삭제
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
