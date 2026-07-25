"use client";

/**
 * 취합 관리 대시보드 (운영진 전용, admin_token 필요)
 */

import { Suspense, use, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Users,
  Copy,
  Lock,
  Unlock,
  Trash2,
  PackageCheck,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { EmailInput } from "@/components/ui/email-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  label: string;
  hex: string;
  sizes: string[];
}

interface ResponseRow {
  id: string;
  name: string;
  colorId?: string;
  size: string;
  quantity: number;
  note?: string;
  isPaid: boolean;
  createdAt: string;
}

interface ManageData {
  title: string;
  crewName?: string;
  status: "open" | "closed" | "ordered";
  deadline?: string;
  deadlinePassed: boolean;
  unitPrice?: number;
  depositInfo?: string;
  orderNumber?: string;
  responseCount: number;
  totalQuantity: number;
  product: {
    id: string;
    name: string;
    images: { colorId: string; view: string; url: string }[];
    variants: Variant[];
  } | null;
  responses?: ResponseRow[];
}

export default function CollectManagePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
          불러오는 중...
        </div>
      }
    >
      <CollectManageContent params={params} />
    </Suspense>
  );
}

function CollectManageContent({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const adminKey = searchParams.get("key") || "";

  const [data, setData] = useState<ManageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  // 주문 전환 폼
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [memo, setMemo] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/collections/${token}?key=${encodeURIComponent(adminKey)}`,
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setForbidden(true);
        return;
      }
      if (!json.data.responses) {
        // 관리 키가 틀리면 responses가 내려오지 않음
        setForbidden(true);
        return;
      }
      setData(json.data);
    } catch {
      setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, [token, adminKey]);

  useEffect(() => {
    load();
  }, [load]);

  const variants = useMemo(() => data?.product?.variants || [], [data]);
  const variantLabel = useCallback(
    (colorId?: string) =>
      variants.find((v) => v.id === colorId)?.label || colorId || "-",
    [variants],
  );

  // 색상 × 사이즈 집계
  const aggregate = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const r of data?.responses || []) {
      const color = r.colorId || "-";
      if (!map.has(color)) map.set(color, new Map());
      const sizeMap = map.get(color)!;
      sizeMap.set(r.size, (sizeMap.get(r.size) || 0) + r.quantity);
    }
    return map;
  }, [data]);

  const paidCount = useMemo(
    () => (data?.responses || []).filter((r) => r.isPaid).length,
    [data],
  );

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/collect/${token}`
      : "";

  const copyShare = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success("공유 링크가 복사되었습니다.");
  };

  const togglePaid = async (r: ResponseRow) => {
    const res = await fetch(`/api/collections/${token}/responses`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        responseId: r.id,
        adminToken: adminKey,
        isPaid: !r.isPaid,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast.error(json.error || "변경에 실패했습니다.");
      return;
    }
    setData((prev) =>
      prev
        ? {
            ...prev,
            responses: prev.responses?.map((x) =>
              x.id === r.id ? { ...x, isPaid: !r.isPaid } : x,
            ),
          }
        : prev,
    );
  };

  const deleteResponse = async (r: ResponseRow) => {
    if (!confirm(`${r.name}님의 제출을 삭제할까요?`)) return;
    const res = await fetch(
      `/api/collections/${token}/responses?responseId=${r.id}&adminToken=${encodeURIComponent(adminKey)}`,
      { method: "DELETE" },
    );
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast.error(json.error || "삭제에 실패했습니다.");
      return;
    }
    toast.success("삭제되었습니다.");
    load();
  };

  const toggleStatus = async () => {
    if (!data) return;
    const next = data.status === "open" ? "closed" : "open";
    const res = await fetch(`/api/collections/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminToken: adminKey, status: next }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      toast.error(json.error || "변경에 실패했습니다.");
      return;
    }
    toast.success(next === "closed" ? "취합을 마감했습니다." : "취합을 다시 열었습니다.");
    load();
  };

  const handleConvert = async () => {
    if (converting) return;
    if (!customerName.trim() || !customerPhone.trim() || !address.trim()) {
      toast.error("주문자 이름, 연락처, 주소를 입력해주세요.");
      return;
    }
    setConverting(true);
    try {
      const res = await fetch(`/api/collections/${token}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken: adminKey,
          customerName,
          customerPhone,
          customerEmail: customerEmail || undefined,
          shippingInfo: {
            recipientName: customerName,
            phone: customerPhone,
            zipCode,
            address,
            addressDetail,
            organizationName: data?.crewName,
            memo,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);
      toast.success(`주문이 접수되었습니다. (${json.order.orderNumber})`);
      setShowConvert(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "주문 전환에 실패했습니다.");
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (forbidden || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-lg font-medium">접근 권한이 없습니다.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          운영진 관리 링크(key 포함)로 접속해주세요.
        </p>
      </div>
    );
  }

  const responses = data.responses || [];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {data.crewName && (
            <p className="text-sm text-muted-foreground">{data.crewName}</p>
          )}
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            {data.title}
          </h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge>
              {data.status === "open"
                ? "진행 중"
                : data.status === "closed"
                  ? "마감"
                  : "주문 완료"}
            </Badge>
            {data.deadline && (
              <span className="text-sm text-muted-foreground">
                {new Date(data.deadline).toLocaleDateString("ko-KR")} 마감
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyShare}>
            <Copy className="h-4 w-4" /> 공유 링크
          </Button>
          {data.status !== "ordered" && (
            <Button variant="outline" size="sm" onClick={toggleStatus}>
              {data.status === "open" ? (
                <>
                  <Lock className="h-4 w-4" /> 마감하기
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4" /> 다시 열기
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{data.responseCount}</p>
            <p className="text-sm text-muted-foreground">참여 인원</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">{data.totalQuantity}</p>
            <p className="text-sm text-muted-foreground">총 수량</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 text-center">
            <p className="text-2xl font-bold">
              {paidCount}
              <span className="text-base font-normal text-muted-foreground">
                /{data.responseCount}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">입금 완료</p>
          </CardContent>
        </Card>
      </div>

      {data.status === "ordered" && data.orderNumber && (
        <Card className="border-success">
          <CardContent className="pt-5 flex items-center justify-between">
            <div>
              <p className="font-medium">주문이 접수되었습니다.</p>
              <p className="text-sm text-muted-foreground">
                주문번호 {data.orderNumber}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={`/order/${data.orderNumber}`}>주문 확인</a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 사이즈 집계 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            사이즈 집계
          </CardTitle>
        </CardHeader>
        <CardContent>
          {aggregate.size === 0 ? (
            <p className="text-sm text-muted-foreground">아직 제출이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline text-left">
                    <th className="py-2 pr-4 font-medium">색상</th>
                    <th className="py-2 pr-4 font-medium">사이즈별 수량</th>
                    <th className="py-2 text-right font-medium">소계</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(aggregate.entries()).map(([color, sizeMap]) => {
                    const subtotal = Array.from(sizeMap.values()).reduce(
                      (a, b) => a + b,
                      0,
                    );
                    return (
                      <tr key={color} className="border-b border-hairline">
                        <td className="py-2 pr-4">{variantLabel(color)}</td>
                        <td className="py-2 pr-4">
                          {Array.from(sizeMap.entries())
                            .map(([s, q]) => `${s}×${q}`)
                            .join(", ")}
                        </td>
                        <td className="py-2 text-right font-medium">{subtotal}장</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {data.unitPrice != null && data.totalQuantity > 0 && (
            <p className="mt-3 text-right text-sm">
              예상 금액{" "}
              <span className="font-semibold">
                {(data.unitPrice * data.totalQuantity).toLocaleString()}원
              </span>
              <span className="text-muted-foreground">
                {" "}
                (1장 {data.unitPrice.toLocaleString()}원 기준)
              </span>
            </p>
          )}
          {data.unitPrice != null &&
            data.totalQuantity > 0 &&
            data.unitPrice * data.totalQuantity < 50000 && (
              <p className="mt-1 text-right text-xs text-muted-foreground">
                5만원 미만 주문은 배송비 3,000원이 추가됩니다.
              </p>
            )}
        </CardContent>
      </Card>

      {/* 제출 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>제출 목록</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {responses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              아직 제출이 없습니다. 공유 링크를 크루 단톡방에 올려보세요.
            </p>
          )}
          {responses.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 rounded-lg border border-hairline p-3"
            >
              <button
                type="button"
                onClick={() => togglePaid(r)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition",
                  r.isPaid
                    ? "border-success bg-success/10 text-success"
                    : "border-hairline text-muted-foreground hover:border-stone",
                )}
              >
                {r.isPaid ? "입금 완료" : "입금 전"}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {r.name}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {variantLabel(r.colorId)} / {r.size} / {r.quantity}장
                  </span>
                </p>
                {r.note && (
                  <p className="truncate text-xs text-muted-foreground">{r.note}</p>
                )}
              </div>
              {data.status !== "ordered" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => deleteResponse(r)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 주문 전환 */}
      {data.status !== "ordered" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              주문으로 전환
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showConvert ? (
              <>
                <p className="text-sm text-muted-foreground">
                  취합이 끝났다면 제출 내역 그대로 주문서를 만들 수 있어요.
                  디자인은 주문 접수 후 담당자와 함께 확정합니다.
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={responses.length === 0}
                  onClick={() => setShowConvert(true)}
                >
                  주문서 작성하기 ({data.totalQuantity}장)
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    주문자 이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    placeholder="홍길동"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    연락처 <span className="text-red-500">*</span>
                  </Label>
                  <PhoneInput
                    id="customerPhone"
                    placeholder="010-0000-0000"
                    value={customerPhone}
                    onChange={setCustomerPhone}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">이메일</Label>
                  <EmailInput
                    id="customerEmail"
                    placeholder="crew@example.com"
                    value={customerEmail}
                    onChange={setCustomerEmail}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">우편번호</Label>
                    <Input
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">
                      주소 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressDetail">상세 주소</Label>
                  <Input
                    id="addressDetail"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memo">요청사항</Label>
                  <Textarea
                    id="memo"
                    placeholder="디자인 관련 요청이나 일정 문의를 남겨주세요"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConvert(false)}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={converting}
                    onClick={handleConvert}
                  >
                    {converting ? "접수 중..." : "주문 접수하기"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
