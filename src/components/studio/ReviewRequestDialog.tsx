"use client";

/**
 * 제작 가능 여부 확인 요청 다이얼로그 (크루장)
 * 스튜디오 디자인(로고 포함)을 그대로 공장 심사로 제출한다.
 * 스튜디오만으로 부족할 때 레퍼런스(이미지·PDF·기타)를 첨부로 함께 전달할 수 있다.
 * 성공 시 "내 제작 문의"로 안내 (등록은 승인 후 그 화면에서).
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
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

const MAX_FILES = 5;
const MAX_SIZE = 50 * 1024 * 1024; // 50MB (서버와 동일)

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
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_SIZE);
    if (tooBig) {
      toast.error(`파일당 최대 50MB까지예요 (${tooBig.name})`);
      return;
    }
    setFiles((prev) => {
      const merged = [...prev, ...incoming].slice(0, MAX_FILES);
      if (prev.length + incoming.length > MAX_FILES) {
        toast.error(`레퍼런스는 최대 ${MAX_FILES}개까지 첨부할 수 있어요.`);
      }
      return merged;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("colorId", colorId);
      fd.append("designLayers", JSON.stringify(designLayers));
      if (note.trim()) fd.append("note", note.trim());
      files.forEach((f) => fd.append("files", f));

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
      setFiles([]);
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

          {/* 레퍼런스 첨부 (선택) — 스튜디오만으로 부족할 때 */}
          <div>
            <Label className="text-xs text-muted-foreground">
              레퍼런스 첨부 (선택 · 최대 {MAX_FILES}개)
            </Label>
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              참고 이미지·PDF 등을 함께 보내면 공장이 더 정확히 판단해요.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,.ai,.eps,.psd,.svg,.zip"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={files.length >= MAX_FILES}
            >
              <Paperclip className="h-4 w-4" />
              파일 선택
            </Button>

            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 rounded-lg border border-hairline bg-soft-cloud px-2.5 py-1.5 text-xs"
                  >
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{f.name}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {(f.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      aria-label="첨부 삭제"
                      className="shrink-0 text-muted-foreground hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button className="h-11 w-full" disabled={submitting} onClick={submit}>
            {submitting ? "접수 중..." : "제작 문의 보내기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
