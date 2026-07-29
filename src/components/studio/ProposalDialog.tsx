"use client";

/**
 * 크루원 디자인 제안 다이얼로그 (비로그인)
 * 스튜디오에서 만든 디자인을 운영진의 크루 상점에 제안한다.
 * 이름·연락처(선택)·메모·레퍼런스 첨부. 운영진 채택 시 제작문의로 변환된다.
 */
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
const MAX_SIZE = 50 * 1024 * 1024;

export function ProposalDialog({
  open,
  onOpenChange,
  storeToken,
  productId,
  colorId,
  designLayers,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storeToken: string;
  productId: string;
  colorId: string;
  designLayers: DesignLayer[];
  onSubmitted?: () => void;
}) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
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
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submit = async () => {
    if (!name.trim()) {
      toast.error("제안자 이름을 입력해주세요.");
      return;
    }
    if (!designLayers || designLayers.length === 0) {
      toast.error("디자인을 먼저 완성해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      fd.append("colorId", colorId);
      fd.append("designLayers", JSON.stringify(designLayers));
      fd.append("proposerName", name.trim());
      if (contact.trim()) fd.append("proposerContact", contact.trim());
      if (note.trim()) fd.append("note", note.trim());
      files.forEach((f) => fd.append("files", f));

      const res = await fetch(`/api/store/${storeToken}/proposals`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "제안 실패");

      toast.success("디자인 제안이 접수되었습니다!", {
        description: "운영진이 확인 후 채택하면 상점에 올라가요.",
      });
      onOpenChange(false);
      setName("");
      setContact("");
      setNote("");
      setFiles([]);
      onSubmitted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "제안에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>우리 크루에 디자인 제안하기</DialogTitle>
          <DialogDescription>
            지금 만든 디자인을 크루 운영진에게 제안해요. 운영진이 채택하면 공장
            확인을 거쳐 상점에 올라가요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pname" className="text-xs text-muted-foreground">
                이름 *
              </Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pcontact" className="text-xs text-muted-foreground">
                연락처 (선택)
              </Label>
              <Input
                id="pcontact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="010-0000-0000"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="pnote" className="text-xs text-muted-foreground">
              메모 (선택)
            </Label>
            <Textarea
              id="pnote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: 등판에 크루 슬로건 넣고 싶어요"
              rows={2}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">
              레퍼런스 첨부 (선택 · 최대 {MAX_FILES}개)
            </Label>
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
              className="mt-1.5 gap-1.5"
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
            {submitting ? "제안 중..." : "제안 보내기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
