"use client";

/**
 * 크루 상점 팬레터 — 팬이 크루에 응원 메시지를 남기고(이미지·좋아요·댓글) 함께 본다.
 */
import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Heart, MessageCircle, ImageIcon, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LetterItem {
  id: string;
  authorName: string;
  message: string;
  imageUrl: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}
interface Comment {
  id: string;
  authorName: string;
  message: string;
  isOwner: boolean;
  createdAt: string;
}
interface LetterDetail extends LetterItem {
  comments: Comment[];
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR");
const likedKey = (id: string) => `fanlike:${id}`;

export default function FanLettersPage({
  params,
}: {
  params: Promise<{ storeToken: string }>;
}) {
  const { storeToken } = use(params);
  const base = `/api/store/${storeToken}/fan-letters`;

  const [crewName, setCrewName] = useState("");
  const [items, setItems] = useState<LetterItem[] | null>(null);

  // 작성 폼
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // 상세 모달
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LetterDetail | null>(null);
  const [comment, setComment] = useState("");
  const [commentName, setCommentName] = useState("");

  const load = useCallback(() => {
    fetch(base)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setCrewName(j.data.crewName);
          setItems(j.data.items);
        } else setItems([]);
      })
      .catch(() => setItems([]));
  }, [base]);
  useEffect(load, [load]);

  const submit = async () => {
    if (!name.trim() || !message.trim()) {
      toast.error("이름과 메시지를 입력해 주세요.");
      return;
    }
    setPosting(true);
    try {
      const fd = new FormData();
      fd.append("authorName", name.trim());
      fd.append("message", message.trim());
      if (image) fd.append("image", image);
      const res = await fetch(base, { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "작성 실패");
      toast.success("팬레터를 남겼어요!");
      setMessage("");
      setImage(null);
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "작성에 실패했습니다.");
    } finally {
      setPosting(false);
    }
  };

  const openDetail = async (id: string) => {
    setOpenId(id);
    setDetail(null);
    const j = await fetch(`${base}/${id}`).then((r) => r.json());
    if (j.success) setDetail(j.data);
  };

  const like = async (id: string) => {
    if (typeof window !== "undefined" && localStorage.getItem(likedKey(id))) {
      toast.info("이미 좋아요를 눌렀어요.");
      return;
    }
    const j = await fetch(`${base}/${id}/like`, { method: "POST" }).then((r) => r.json());
    if (j.success) {
      localStorage.setItem(likedKey(id), "1");
      setItems((prev) =>
        prev
          ? prev.map((l) => (l.id === id ? { ...l, likeCount: j.data.likeCount } : l))
          : prev,
      );
      setDetail((d) => (d && d.id === id ? { ...d, likeCount: j.data.likeCount } : d));
    }
  };

  const addComment = async () => {
    if (!detail || !comment.trim()) return;
    const j = await fetch(`${base}/${detail.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorName: commentName.trim() || undefined, message: comment.trim() }),
    }).then((r) => r.json());
    if (j.success) {
      setDetail({ ...detail, comments: [...detail.comments, j.data] });
      setComment("");
      setItems((prev) =>
        prev
          ? prev.map((l) =>
              l.id === detail.id ? { ...l, commentCount: l.commentCount + 1 } : l,
            )
          : prev,
      );
    } else {
      toast.error(j.error || "댓글 작성 실패");
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link
        href={`/store/${storeToken}`}
        className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" /> {crewName || "상점"}
      </Link>
      <h1 className="text-xl font-bold">팬레터</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {crewName}에게 응원 메시지를 남겨보세요.
      </p>

      {/* 작성 폼 */}
      <div className="mt-4 rounded-xl border border-hairline p-4">
        <p className="mb-2 text-sm font-bold">
          To. <span className="text-ink">{crewName}</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름/닉네임"
            maxLength={100}
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="응원의 한마디를 남겨주세요."
            rows={2}
            maxLength={500}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImage(e.target.files?.[0] ?? null)}
        />
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ink"
          >
            <ImageIcon className="h-4 w-4" />
            {image ? image.name.slice(0, 20) : "사진 첨부"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">{message.length}/500</span>
            <Button size="sm" onClick={submit} disabled={posting}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "등록"}
            </Button>
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {items === null ? (
          <div className="col-span-full flex justify-center py-14">
            <Spinner className="h-7 w-7 text-ink" />
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full rounded-xl border border-hairline py-14 text-center text-sm text-muted-foreground">
            아직 팬레터가 없어요. 첫 응원을 남겨보세요!
          </div>
        ) : (
          items.map((l) => (
            <button
              key={l.id}
              onClick={() => openDetail(l.id)}
              className="rounded-xl border border-hairline p-4 text-left transition-colors hover:border-ink"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{l.authorName}</span>
                <span className="text-[11px] text-muted-foreground">
                  {fmtDate(l.createdAt)}
                </span>
              </div>
              {l.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.imageUrl}
                  alt=""
                  className="mt-2 h-32 w-full rounded-lg object-cover"
                />
              )}
              <p className="mt-2 line-clamp-3 text-sm text-charcoal">{l.message}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" /> {l.likeCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> 댓글 {l.commentCount}개
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* 상세 모달 */}
      <Dialog open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>팬레터</DialogTitle>
          </DialogHeader>
          {!detail ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-7 w-7 text-ink" />
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold">{detail.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtDate(detail.createdAt)}
                </span>
              </div>
              {detail.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.imageUrl}
                  alt=""
                  className="mt-3 w-full rounded-lg object-cover"
                />
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-charcoal">
                {detail.message}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-hairline pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => like(detail.id)}
                >
                  <Heart className="h-4 w-4" /> {detail.likeCount}
                </Button>
                <span className="text-xs text-muted-foreground">
                  댓글 {detail.comments.length}개
                </span>
              </div>

              {/* 댓글 */}
              <ul className="mt-3 space-y-2">
                {detail.comments.map((c) => (
                  <li
                    key={c.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      c.isOwner ? "bg-[#C7FF00]/15" : "bg-soft-cloud"
                    }`}
                  >
                    <span className="mr-1 font-bold">
                      {c.authorName}
                      {c.isOwner && (
                        <span className="ml-1 rounded bg-ink px-1 py-0.5 text-[10px] text-canvas">
                          크루
                        </span>
                      )}
                    </span>
                    <span className="text-charcoal">{c.message}</span>
                  </li>
                ))}
              </ul>

              {/* 댓글 입력 */}
              <div className="mt-3 space-y-2">
                <Input
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="이름(선택)"
                  className="h-9"
                  maxLength={100}
                />
                <div className="flex gap-2">
                  <Input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="크리에이터를 응원하는 댓글을 남겨주세요."
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                    maxLength={500}
                  />
                  <Button onClick={addComment} disabled={!comment.trim()}>
                    등록
                  </Button>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => setOpenId(null)}
            className="absolute right-4 top-4 text-muted-foreground hover:text-ink"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
