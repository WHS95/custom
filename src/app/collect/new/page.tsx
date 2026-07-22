"use client";

/**
 * 단체 주문 사이즈 취합 링크 만들기 (크루 운영진용)
 */

import { useEffect, useState } from "react";
import { Users, Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Product } from "@/domain/product/types";

interface CreatedLinks {
  shareUrl: string;
  manageUrl: string;
}

export default function CollectNewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedLinks | null>(null);
  const [copied, setCopied] = useState<"share" | "manage" | null>(null);

  const [title, setTitle] = useState("");
  const [crewName, setCrewName] = useState("");
  const [productId, setProductId] = useState("");
  const [unitPrice, setUnitPrice] = useState<string>("");
  const [deadline, setDeadline] = useState("");
  const [depositInfo, setDepositInfo] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setProducts(json.data);
      })
      .catch(() => toast.error("상품 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSelectProduct = (product: Product) => {
    setProductId(product.id);
    setUnitPrice(String(product.basePrice));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !productId) {
      toast.error("취합 제목과 상품을 선택해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          crewName: crewName || undefined,
          productId,
          unitPrice: unitPrice ? Number(unitPrice) : undefined,
          deadline: deadline ? new Date(`${deadline}T23:59:59`).toISOString() : undefined,
          depositInfo: depositInfo || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "생성 실패");
      }
      const origin = window.location.origin;
      setCreated({
        shareUrl: `${origin}/collect/${json.data.token}`,
        manageUrl: `${origin}/collect/${json.data.token}/manage?key=${json.data.adminToken}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "취합 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (text: string, which: "share" | "manage") => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    toast.success("복사되었습니다.");
    setTimeout(() => setCopied(null), 1500);
  };

  if (created) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              취합 링크가 만들어졌어요
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>크루원에게 공유할 링크</Label>
              <div className="flex gap-2">
                <Input readOnly value={created.shareUrl} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copy(created.shareUrl, "share")}
                >
                  {copied === "share" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                카톡방에 공유하면 크루원이 이름과 사이즈만 입력하면 됩니다.
              </p>
            </div>
            <div className="space-y-2">
              <Label>운영진 관리 링크 (공유 금지)</Label>
              <div className="flex gap-2">
                <Input readOnly value={created.manageUrl} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copy(created.manageUrl, "manage")}
                >
                  {copied === "manage" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm text-danger">
                이 링크를 잃어버리면 취합을 관리할 수 없어요. 꼭 저장해두세요.
              </p>
            </div>
            <Button className="w-full" size="lg" asChild>
              <a href={created.manageUrl}>취합 현황 보러가기</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          단체 주문 사이즈 취합
        </h1>
        <p className="mt-2 text-muted-foreground">
          링크 하나로 크루원들의 사이즈를 모으세요. 카톡으로 일일이 물어볼 필요
          없이, 자동으로 집계되고 그대로 주문까지 이어집니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>취합 정보 입력</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              취합 제목 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="예: 한강크루 2026 여름 단체티"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="crewName">크루/단체명</Label>
            <Input
              id="crewName"
              placeholder="예: 한강러닝크루"
              value={crewName}
              onChange={(e) => setCrewName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              상품 선택 <span className="text-red-500">*</span>
            </Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((product) => {
                  const frontImage =
                    product.images.find((img) => img.view === "front")?.url ||
                    product.images[0]?.url;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className={cn(
                        "rounded-lg border p-2 text-left transition",
                        productId === product.id
                          ? "border-ink ring-2 ring-ink"
                          : "border-hairline hover:border-stone",
                      )}
                    >
                      {frontImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={frontImage}
                          alt={product.name}
                          className="mb-2 aspect-square w-full rounded object-cover"
                        />
                      )}
                      <p className="text-sm font-medium leading-tight">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.basePrice.toLocaleString()}원~
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">1인당 가격 안내 (원)</Label>
            <Input
              id="unitPrice"
              type="number"
              min={0}
              placeholder={selectedProduct ? String(selectedProduct.basePrice) : "30000"}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              크루원에게 안내할 1장당 가격이에요. 비워두면 상품 기본가로 표시됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">마감일</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositInfo">입금 안내</Label>
            <Textarea
              id="depositInfo"
              placeholder="예: 카카오뱅크 3333-00-0000000 홍길동 / 제출 후 3일 내 입금해주세요"
              value={depositInfo}
              onChange={(e) => setDepositInfo(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={submitting || !title.trim() || !productId}
            onClick={handleSubmit}
          >
            {submitting ? "생성 중..." : "취합 링크 만들기"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
