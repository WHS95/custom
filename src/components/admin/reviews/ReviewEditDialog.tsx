"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Star } from "lucide-react";
import type { Review } from "@/domain/review/types";

export interface ReviewEditDialogProps {
  review: Review | null;
  onOpenChange: (open: boolean) => void;
  onEdited: () => void;
}

export default function ReviewEditDialog({
  review,
  onOpenChange,
  onEdited,
}: ReviewEditDialogProps) {
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    rating: 5,
    adminMemo: "",
    isFeatured: false,
    sortOrder: 0,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (review) {
      setEditForm({
        title: review.title || "",
        content: review.content,
        rating: review.rating,
        adminMemo: review.adminMemo || "",
        isFeatured: review.isFeatured,
        sortOrder: review.sortOrder,
      });
    }
  }, [review]);

  const handleEdit = async () => {
    if (!review) return;

    setIsEditing(true);
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const result = await response.json();
      if (result.success) {
        toast.success("후기가 수정되었습니다");
        onOpenChange(false);
        onEdited();
      } else {
        toast.error(result.error || "수정에 실패했습니다");
      }
    } catch (error) {
      console.error("Edit review error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <Dialog
      open={!!review}
      onOpenChange={(open) => !open && onOpenChange(false)}
    >
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>후기 수정</DialogTitle>
          <DialogDescription>
            후기 내용을 수정하고 관리자 메모를 남길 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>제목</Label>
            <Input
              value={editForm.title}
              onChange={(e) =>
                setEditForm({ ...editForm, title: e.target.value })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label>내용</Label>
            <Textarea
              value={editForm.content}
              onChange={(e) =>
                setEditForm({ ...editForm, content: e.target.value })
              }
              rows={4}
            />
          </div>
          <div className='space-y-2'>
            <Label>별점</Label>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setEditForm({ ...editForm, rating: star })}
                  className='p-1'
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= editForm.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Label>관리자 메모</Label>
            <Textarea
              value={editForm.adminMemo}
              onChange={(e) =>
                setEditForm({ ...editForm, adminMemo: e.target.value })
              }
              placeholder='내부용 메모 (공개되지 않음)'
              rows={2}
            />
          </div>
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              id='isFeatured'
              checked={editForm.isFeatured}
              onChange={(e) =>
                setEditForm({ ...editForm, isFeatured: e.target.checked })
              }
              className='w-4 h-4'
            />
            <Label htmlFor='isFeatured'>대표 후기로 표시</Label>
          </div>
          <div className='space-y-2'>
            <Label>정렬 순서</Label>
            <Input
              type='number'
              value={editForm.sortOrder}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  sortOrder: Number(e.target.value),
                })
              }
            />
            <p className='text-xs text-gray-500'>
              숫자가 작을수록 먼저 표시됩니다
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleEdit} disabled={isEditing}>
            {isEditing && <Spinner />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
