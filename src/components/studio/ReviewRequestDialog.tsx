"use client";

/**
 * 제작 가능 여부 확인 요청 다이얼로그 (크루장)
 * 스튜디오 디자인(로고 포함)을 그대로 공장 심사로 제출한다.
 * 로고 파일은 디자인에 이미 포함되므로 별도 첨부는 받지 않는다.
 * 성공 시 "내 제작 문의"로 안내 (등록은 승인 후 그 화면에서).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { DesignLayer } from "@/lib/store/design-store";

export function ReviewRequestDialog({
  open,
  onOpenChange,
  productId,
  colorId,
  designLayers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  productId: string;
  colorId: string;
  designLayers: DesignLayer[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("colorId", colorId);
      fd.append("designLayers", JSON.stringify(designLayers));
      if (note.trim()) fd.append("note", note.trim());

      const res = await fetch("/api/manufacture-reviews", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "접수 실패");

      toast.success("제작 문의가 접수되었습니다!", {
        description: "공장 확인 후 '내 제작 문의'에서 결과를 볼 수 있어요.",
      });
      onOpenChange(false);
      setNote("");
      router.push("/manufacture-reviews");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "접수에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>제작 가능 여부 확인 요청</DialogTitle>
          <DialogDescription>
            지금 만든 디자인(로고 포함) 그대로 공장에 제작 가능한지 확인해요.
            승인되면 상점에 등록할 수 있어요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">
              요청 메모 (선택)
            </Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 반사 프린트 가능한가요? 납기는 어느 정도일까요?"
              rows={3}
              className="mt-1"
            />
          </div>

          <p className="rounded-lg bg-soft-cloud p-3 text-[11px] leading-relaxed text-muted-foreground">
            디자인에 올린 로고 파일이 그대로 공장에 전달되므로 따로 파일을
            첨부할 필요가 없어요.
          </p>

          <Button className="h-11 w-full" disabled={submitting} onClick={submit}>
            {submitting ? "접수 중..." : "제작 문의 보내기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
