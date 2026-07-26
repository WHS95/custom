"use client";

/**
 * 공장 제작 확인 페이지 (공개 — 토큰 링크)
 * 크루장 시안(design_snapshot) + 참고 첨부를 확인하고 제작 가능/불가 판정.
 */

import { use, useEffect, useState } from "react";
import { CheckCircle2, XCircle, FileText, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  HatDesignCanvas,
  type DesignLayer,
} from "@/components/shared/HatDesignCanvas";
import type { HatView } from "@/lib/store/studio-context";

interface Attachment {
  name: string;
  url: string;
  size: number;
}
interface ReviewData {
  crewName: string | null;
  productName: string;
  note: string | null;
  status: "pending" | "approved" | "rejected";
  factoryComment: string | null;
  reviewedAt: string | null;
  attachments: Attachment[];
  designLayers: DesignLayer[] | null;
  designColor: {
    id: string;
    label: string;
    hex: string;
    views: Record<string, string>;
  } | null;
}

export default function FactoryReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<HatView | null>(null);

  const load = () => {
    fetch(`/api/manufacture-reviews/${token}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  };
  useEffect(load, [token]);

  const decide = async (approved: boolean) => {
    if (!approved && !comment.trim()) {
      toast.error("제작 불가 사유를 남겨주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/manufacture-reviews/${token}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved, comment: comment.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "실패");
      toast.success(approved ? "제작 가능으로 전달했습니다." : "제작 불가로 전달했습니다.");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }
  if (notFound || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium">문의를 찾을 수 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          링크가 정확한지 확인해주세요.
        </p>
      </div>
    );
  }

  const views: HatView[] =
    data.designLayers && data.designLayers.length > 0
      ? ([...new Set(data.designLayers.map((l) => l.view))] as HatView[])
      : [];
  const activeView = view ?? views[0] ?? "front";
  const decided = data.status !== "pending";

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-5">
      <div className="text-center">
        <p className="text-kicker text-xs text-muted-foreground">
          제작 가능 여부 확인
        </p>
        <h1 className="mt-1 text-xl font-bold">{data.productName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.crewName} · {data.designColor?.label}
        </p>
      </div>

      {/* 시안 */}
      {data.designLayers && data.designColor && (
        <div>
          <div className="mx-auto w-64">
            <HatDesignCanvas
              hatColor={data.designColor.id}
              currentView={activeView}
              layers={data.designLayers}
              editable={false}
              showSafeZone={false}
              showViewLabel={false}
              productColors={[
                {
                  id: data.designColor.id,
                  label: data.designColor.label,
                  hex: data.designColor.hex,
                  views: data.designColor.views as Record<HatView, string>,
                },
              ]}
              className="aspect-square w-full rounded-lg border border-hairline"
            />
          </div>
          {views.length > 1 && (
            <div className="mt-2 flex justify-center gap-2">
              {views.map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`rounded-full border px-3 py-1 text-xs font-bold transition ${
                    activeView === v
                      ? "border-ink bg-ink text-canvas"
                      : "border-hairline text-muted-foreground"
                  }`}
                >
                  {v === "front" ? "앞면" : v === "back" ? "뒷면" : v}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 요청 메모 */}
      {data.note && (
        <div className="rounded-lg bg-soft-cloud p-3 text-sm">
          <p className="mb-1 text-xs font-bold text-muted-foreground">크루 요청</p>
          {data.note}
        </div>
      )}

      {/* 첨부 */}
      {data.attachments.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Paperclip className="h-3 w-3" /> 참고 파일 {data.attachments.length}개
          </p>
          {data.attachments.map((a) => (
            <a
              key={a.url}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-hairline-soft px-3 py-2 text-sm hover:bg-soft-cloud"
            >
              <FileText className="h-4 w-4 shrink-0 text-mute" />
              <span className="min-w-0 flex-1 truncate">{a.name}</span>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {(a.size / 1024 / 1024).toFixed(1)}MB
              </span>
            </a>
          ))}
        </div>
      )}

      {/* 판정 */}
      {decided ? (
        <div
          className={`rounded-lg border p-4 text-center ${
            data.status === "approved"
              ? "border-success/40 bg-success/5"
              : "border-danger/40 bg-danger/5"
          }`}
        >
          <p className="font-bold">
            {data.status === "approved" ? "✅ 제작 가능으로 전달됨" : "🚫 제작 불가로 전달됨"}
          </p>
          {data.factoryComment && (
            <p className="mt-1 text-sm text-muted-foreground">{data.factoryComment}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3 border-t border-hairline-soft pt-4">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="의견 (제작 불가 시 사유 필수 · 납기·주의사항 등)"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              className="h-12 flex-1 bg-success text-white hover:bg-success/90"
              disabled={submitting}
              onClick={() => decide(true)}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> 제작 가능
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 border-danger text-danger hover:bg-danger/5"
              disabled={submitting}
              onClick={() => decide(false)}
            >
              <XCircle className="mr-1.5 h-4 w-4" /> 제작 불가
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
