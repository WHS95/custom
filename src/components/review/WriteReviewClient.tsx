"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Star, Upload, X, Loader2, AlertCircle } from "lucide-react";

interface WriteReviewClientProps {
  orderNumber?: string;
  initialAuthorName?: string;
  initialOrganizationName?: string;
  error?: string | null;
}

export function WriteReviewClient({
  orderNumber,
  initialAuthorName = "",
  initialOrganizationName = "",
  error = null,
}: WriteReviewClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    authorName: initialAuthorName,
    organizationName: initialOrganizationName,
    title: "",
    content: "",
    rating: 5,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 5 - images.length;
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
        setImages((prev) => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!orderNumber) return;

    if (!form.authorName.trim()) {
      toast.error("작성자명을 입력해주세요");
      return;
    }
    if (!form.content.trim()) {
      toast.error("후기 내용을 입력해주세요");
      return;
    }
    if (form.content.length < 10) {
      toast.error("후기 내용은 최소 10자 이상 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderNumber,
          authorType: "customer",
          authorName: form.authorName.trim(),
          organizationName: form.organizationName.trim() || undefined,
          title: form.title.trim() || undefined,
          content: form.content.trim(),
          rating: form.rating,
          imageDataList: images,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message || "후기가 제출되었습니다");
        router.push("/gallery");
      } else {
        toast.error(result.error || "후기 제출에 실패했습니다");
      }
    } catch (err) {
      console.error("Submit review error:", err);
      toast.error("오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error || !orderNumber) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <Card>
          <CardContent className='py-12'>
            <div className='text-center space-y-4'>
              <AlertCircle className='h-12 w-12 mx-auto text-red-400' />
              <h2 className='text-xl font-semibold text-gray-800'>
                후기 작성 불가
              </h2>
              <p className='text-gray-600'>
                {error || "주문번호가 필요합니다."}
              </p>
              <div className='pt-4 space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => router.push("/gallery")}
                >
                  후기 목록으로
                </Button>
                <Button onClick={() => router.push("/mypage/orders")}>
                  주문 내역으로
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-2xl'>
      <Button
        variant='ghost'
        className='mb-4'
        onClick={() => router.push("/gallery")}
      >
        <ArrowLeft className='mr-2 h-4 w-4' />
        목록으로
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>후기 작성</CardTitle>
          <CardDescription>
            주문번호 {orderNumber}에 대한 후기를 작성합니다
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='authorName'>작성자명 *</Label>
            <Input
              id='authorName'
              value={form.authorName}
              onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              placeholder='홍길동'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='organizationName'>단체/회사명 (선택)</Label>
            <Input
              id='organizationName'
              value={form.organizationName}
              onChange={(e) =>
                setForm({ ...form, organizationName: e.target.value })
              }
              placeholder='런하우스 크루'
            />
          </div>

          <div className='space-y-2'>
            <Label>별점</Label>
            <div className='flex gap-1'>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type='button'
                  onClick={() => setForm({ ...form, rating: star })}
                  className='p-1 transition-transform hover:scale-110'
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= form.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='title'>제목 (선택)</Label>
            <Input
              id='title'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder='후기 제목을 입력하세요'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='content'>후기 내용 *</Label>
            <Textarea
              id='content'
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder='제품에 대한 솔직한 후기를 작성해주세요. (최소 10자)'
              rows={6}
            />
            <p className='text-xs text-gray-500 text-right'>
              {form.content.length}자
            </p>
          </div>

          <div className='space-y-2'>
            <Label>사진 첨부 (최대 5장)</Label>
            <div className='grid grid-cols-5 gap-2'>
              {images.map((img, idx) => (
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
                    onClick={() => removeImage(idx)}
                    className='absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  className='aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors'
                >
                  <Upload className='h-5 w-5 mb-1' />
                  <span className='text-xs'>추가</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              className='hidden'
              onChange={handleImageSelect}
            />
            <p className='text-xs text-gray-500'>JPG, PNG 파일 (최대 5MB)</p>
          </div>

          <div className='p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700'>
            작성하신 후기는 관리자 검토 후 게시됩니다. 부적절한 내용이 포함된
            경우 게시가 거절될 수 있습니다.
          </div>

          <div className='flex gap-2 pt-4'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => router.push("/gallery")}
            >
              취소
            </Button>
            <Button
              className='flex-1'
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              후기 제출
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
