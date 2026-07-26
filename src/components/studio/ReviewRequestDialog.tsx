"use client";

/**
 * 제작 가능 여부 확인 요청 다이얼로그 (크루장)
 * 스튜디오 디자인 + 참고 첨부파일을 공장 심사로 제출한다.
 * 성공 시 "내 제작 문의"로 안내 (등록은 승인 후 그 화면에서).
 */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X } from "lucide-react";
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

const ALLOWED_EXT = [".ai", ".eps", ".pdf", ".psd", ".png", ".jpg", ".jpeg"];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (next.length >= MAX_FILES) {
        toast.error(`최대 ${MAX_FILES}개까지 첨부할 수 있어요.`);
        break;
      }
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
      if (!ALLOWED_EXT.includes(ext)) {
        toast.error(`${f.name}: 허용되지 않는 형식`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: 50MB 초과`);
        continue;
      }
      if (next.some((x) => x.name === f.name)) continue;
      next.push(f);
    }
    setFiles(next);
  };

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
      setFiles([]);
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
            이 디자인을 공장에서 제작할 수 있는지 먼저 확인해요. 승인되면 상점에
            등록할 수 있어요.
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
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              참고 파일 첨부 (선택)
            </Label>
            <div
              onClick={() => files.length < MAX_FILES && inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
              className={`mt-1 cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                files.length >= MAX_FILES
                  ? "opacity-50"
                  : "border-hairline hover:border-ink/40"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={ALLOWED_EXT.join(",")}
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />
              <Upload className="mx-auto mb-1.5 h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                드래그하거나 클릭 · {ALLOWED_EXT.join(" ")} · 최대 {MAX_FILES}개·50MB
              </p>
            </div>

            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="flex items-center gap-2 rounded-md bg-soft-cloud px-2.5 py-1.5"
                  >
                    <FileText className="h-4 w-4 shrink-0 text-mute" />
                    <span className="min-w-0 flex-1 truncate text-xs">
                      {f.name}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatSize(f.size)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles(files.filter((_, idx) => idx !== i));
                      }}
                      className="shrink-0 text-mute hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            className="h-11 w-full"
            disabled={submitting}
            onClick={submit}
          >
            {submitting ? "접수 중..." : "제작 문의 보내기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
