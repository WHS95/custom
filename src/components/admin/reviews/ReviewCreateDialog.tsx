"use client";

import { useState, useRef } from "react";
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
import { Star, X, Upload } from "lucide-react";
import type { CreateReviewDTO } from "@/domain/review/types";

export interface ReviewCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export default function ReviewCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: ReviewCreateDialogProps) {
  const [createForm, setCreateForm] = useState<
    CreateReviewDTO & { organizationName?: string }
  >({
    authorName: "",
    organizationName: "",
    title: "",
    content: "",
    rating: 5,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createImages, setCreateImages] = useState<string[]>([]);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - createImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드 가능합니다");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB 이하여야 합니다");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCreateImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    if (createFileInputRef.current) {
      createFileInputRef.current.value = "";
    }
  };

  const removeCreateImage = (index: number) => {
    setCreateImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!createForm.authorName || !createForm.content) {
      toast.error("작성자명과 내용은 필수입니다");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          authorType: "admin",
          imageDataList: createImages,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || "후기가 등록되었습니다");
        onOpenChange(false);
        setCreateForm({
          authorName: "",
          organizationName: "",
          title: "",
          content: "",
          rating: 5,
        });
        setCreateImages([]);
        onCreated();
      } else {
        toast.error(result.error || "후기 등록에 실패했습니다");
      }
    } catch (error) {
      console.error("Create review error:", error);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setCreateImages([]);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>후기 작성</DialogTitle>
          <DialogDescription>
            관리자가 직접 후기를 작성합니다. 바로 승인됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>작성자명 *</Label>
            <Input
              value={createForm.authorName}
              onChange={(e) =>
                setCreateForm({ ...createForm, authorName: e.target.value })
              }
              placeholder='홍길동'
            />
          </div>
          <div className='space-y-2'>
            <Label>단체/회사명</Label>
            <Input
              value={createForm.organizationName}
              onChange={(e) =>
                setCreateForm({
                  ...createForm,
                  organizationName: e.target.value,
                })
              }
              placeholder='ABC 회사'
            />
          </div>
          <div className='space-y-2'>
            <Label>제목</Label>
            <Input
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
              placeholder='후기 제목'
            />
          </div>
          <div className='space-y-2'>
            <Label>내용 *</Label>
            <Textarea
              value={createForm.content}
              onChange={(e) =>
                setCreateForm({ ...createForm, content: e.target.value })
              }
              placeholder='후기 내용을 작성해주세요...'
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
                  onClick={() =>
                    setCreateForm({ ...createForm, rating: star })
                  }
                  className='p-1'
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= createForm.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className='space-y-2'>
            <Label>사진 첨부 (최대 5장)</Label>
            <div className='grid grid-cols-5 gap-2'>
              {createImages.map((img, idx) => (
                <div
                  key={idx}
                  className='relative aspect-square rounded-lg overflow-hidden border'
                >
                  <img
                    src={img}
                    alt={`업로드 이미지 ${idx + 1}`}
                    className='w-full h-full object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => removeCreateImage(idx)}
                    className='absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
              {createImages.length < 5 && (
                <button
                  type='button'
                  onClick={() => createFileInputRef.current?.click()}
                  className='aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors'
                >
                  <Upload className='h-5 w-5 mb-1' />
                  <span className='text-xs'>추가</span>
                </button>
              )}
            </div>
            <input
              ref={createFileInputRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={handleCreateImageSelect}
            />
            <p className='text-xs text-gray-500'>JPG, PNG 파일 (최대 5MB)</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating && <Spinner />}
            등록
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
