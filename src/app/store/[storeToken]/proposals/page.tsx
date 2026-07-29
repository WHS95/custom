"use client";

/**
 * 운영진 제안함 — 크루원이 보낸 디자인 제안 확인·채택·반려.
 * 채택하면 제작 문의(공장 재승인)로 변환된다.
 */
import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Paperclip,
  Download,
  Check,
  X,
  Copy,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DesignReviewDetail } from "@/components/shared/DesignReviewDetail";
import type { DesignLayer } from "@/components/shared/HatDesignCanvas";

interface Proposal {
  proposalId: string;
  productName: string;
  proposerName: string;
  proposerContact: string | null;
  note: string | null;
  status: "pending" | "adopted" | "rejected";
  adopted: boolean;
  attachments: { name: string; url: string; size: number }[];
  createdAt: string;
  designLayers: DesignLayer[] | null;
  designColor: {
    id: string;
    label: string;
    hex: string;
    views: Record<string, string>;
  } | null;
}

const STATUS_LABEL: Record<Proposal["status"], { label: string; cls: string }> = {
  pending: { label: "새 제안", cls: "bg-[#C7FF00] text-[#0B0C0A]" },
  adopted: { label: "채택됨", cls: "bg-green-100 text-green-700" },
  rejected: { label: "반려됨", cls: "bg-gray-100 text-gray-500" },
};

export default function ProposalsPage({
  params,
}: {
  params: Promise<{ storeToken: string }>;
}) {
  const { storeToken } = use(params);
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/store/${storeToken}/proposals`)
      .then((res) => (res.status === 403 ? Promise.reject("forbidden") : res.json()))
      .then((json) => setItems(json.success ? json.data.items : []))
      .catch((e) => {
        if (e === "forbidden") setForbidden(true);
        setItems([]);
      });
  }, [storeToken]);
  useEffect(load, [load]);

  const decide = async (proposalId: string, action: "adopt" | "reject") => {
    setProcessing(proposalId);
    try {
      const res = await fetch(`/api/store/${storeToken}/proposals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "처리 실패");
      toast.success(
        action === "adopt"
          ? "채택했어요. 공장 확인 후 '내 제작 문의'에서 상점에 등록할 수 있어요."
          : "반려했어요.",
      );
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리에 실패했습니다.");
    } finally {
      setProcessing(null);
    }
  };

  const copyProposeLink = () => {
    const url = `${window.location.origin}/store/${storeToken}/propose`;
    navigator.clipboard.writeText(url);
    toast.success("제안 링크를 복사했어요. 크루원에게 공유하세요.");
  };

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-medium">이 상점의 운영진만 볼 수 있어요.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/login">크루 로그인</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 pb-24">
      <Link
        href={`/store/${storeToken}`}
        className="mb-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-3 w-3" /> 내 상점
      </Link>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold">제안함</h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={copyProposeLink}>
          <Copy className="h-3.5 w-3.5" /> 제안 링크 복사
        </Button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        크루원이 보낸 디자인 제안이에요. 채택하면 공장 확인을 거쳐 상점에 올릴 수 있어요.
      </p>

      <div className="mt-5 space-y-3">
        {items === null ? (
          <div className="flex justify-center py-14">
            <Spinner className="h-7 w-7 text-ink" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-hairline py-14 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto mb-2 h-8 w-8 text-hairline" />
            아직 제안이 없어요. 제안 링크를 크루원에게 공유해 보세요.
          </div>
        ) : (
          items.map((p) => {
            const st = STATUS_LABEL[p.status];
            return (
              <div key={p.proposalId} className="rounded-xl border border-hairline p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{p.proposerName}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.productName}
                      {p.proposerContact ? ` · ${p.proposerContact}` : ""}
                    </p>
                  </div>
                </div>

                <DesignReviewDetail
                  designLayers={p.designLayers}
                  designColor={p.designColor}
                  size="sm"
                />

                {p.note && (
                  <div className="mt-3 rounded-md bg-soft-cloud px-3 py-2 text-xs">
                    <span className="font-bold text-muted-foreground">제안 메모 </span>
                    {p.note}
                  </div>
                )}

                {p.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 flex items-center gap-1 text-xs font-bold text-muted-foreground">
                      <Paperclip className="h-3 w-3" /> 레퍼런스 {p.attachments.length}개
                    </p>
                    <ul className="space-y-1.5">
                      {p.attachments.map((a, ai) => (
                        <li key={ai}>
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-md border border-hairline bg-soft-cloud px-2.5 py-1.5 text-xs hover:bg-hairline-soft"
                          >
                            <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="min-w-0 flex-1 truncate">{a.name}</span>
                            <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {p.status === "pending" ? (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled={processing === p.proposalId}
                      onClick={() => decide(p.proposalId, "reject")}
                    >
                      <X className="mr-1 h-4 w-4" /> 반려
                    </Button>
                    <Button
                      className="flex-1"
                      disabled={processing === p.proposalId}
                      onClick={() => decide(p.proposalId, "adopt")}
                    >
                      {processing === p.proposalId ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <>
                          <Check className="mr-1 h-4 w-4" /> 채택 → 제작 확인
                        </>
                      )}
                    </Button>
                  </div>
                ) : p.status === "adopted" ? (
                  <p className="mt-3 text-xs font-medium text-green-700">
                    ✓ 채택됨 — ‘내 제작 문의’에서 공장 확인·상점 등록 진행
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
