"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, Palette, Tag, Store } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStudioConfig, ProductColor } from "@/lib/store/studio-context";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  useDesignStore,
  useCurrentColorLayers,
} from "@/lib/store/design-store";
import { toast } from "sonner";
import posthog from "posthog-js";
import type { PriceTier } from "@/domain/product/types";
import { getUnitPrice, getDiscountRate } from "@/lib/pricing/price-calculator";
import { PricingTableModal } from "./PricingTableModal";
import { CrewLoginInline } from "@/components/cart/CrewLoginInline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ProductSidebarProps {
  productId?: string; // 상품 ID (UUID)
  selectedColor: string;
  onColorChange: (color: string) => void;
  productColors?: ProductColor[]; // 상품별 색상 (제공되면 config.colors 대신 사용)
  productBasePrice?: number; // 상품별 가격
  productName?: string; // 상품명
  productSizes?: string[]; // 상품별 사이즈 (제공되면 기본 SIZES 대신 사용)
  priceTiers?: PriceTier[]; // 수량 구간별 할인 가격표
}

const DEFAULT_SIZES = ["S", "M", "L", "XL", "FREE"];

export function ProductSidebar({
  productId,
  selectedColor,
  onColorChange,
  productColors,
  productBasePrice,
  productName,
  productSizes,
  priceTiers,
}: ProductSidebarProps) {
  const { config } = useStudioConfig();
  const { t } = useLanguage();
  const router = useRouter();
  const { isAuthenticated, profile, refreshProfile } = useAuth();
  const [registeringStore, setRegisteringStore] = useState(false);
  const [crewGateOpen, setCrewGateOpen] = useState(false);
  const isCrewStaff = isAuthenticated && profile?.user_type === "crew_staff";
  const isCrewPending = isAuthenticated && profile?.user_type === "crew_pending";

  // 상품별 색상이 제공되면 사용, 아니면 기본 config 사용
  const colors = productColors || config.colors;
  const basePrice = productBasePrice ?? config.basePrice;
  const displayName = productName || t("product.name");

  // 상품별 사이즈가 있으면 사용, 없으면 기본값
  const sizes =
    productSizes && productSizes.length > 0 ? productSizes : DEFAULT_SIZES;
  const [selectedSize, setSelectedSize] = useState(sizes[0] || "FREE");
  const [quantity, setQuantity] = useState(1);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // 수량 기반 할인가 계산
  const currentUnitPrice = getUnitPrice(basePrice, quantity, priceTiers);
  const discountRate = getDiscountRate(basePrice, quantity, priceTiers);
  const isDiscounted = currentUnitPrice < basePrice;
  const hasPriceTiers = priceTiers && priceTiers.length > 0;

  // 디자인 스토어에서 색상별 디자인 정보 가져오기
  const layersByColor = useDesignStore((state) => state.layersByColor);
  const currentColorLayers = useCurrentColorLayers();

  const selectedColorData = useMemo(
    () => colors.find((c) => c.id === selectedColor),
    [colors, selectedColor],
  );

  // 현재 색상에 디자인이 있는지 확인
  const hasCurrentDesign = currentColorLayers.length > 0;

  // 디자인이 있는 색상들
  const colorsWithDesign = useMemo(
    () =>
      Object.keys(layersByColor).filter(
        (color) => layersByColor[color] && layersByColor[color].length > 0,
      ),
    [layersByColor],
  );

  /**
   * 우리 크루 상품으로 등록 (피벗 후 유일한 primary 액션)
   */
  const handleRegisterToStore = async () => {
    if (!hasCurrentDesign || !productId) return;
    // 비크루는 게이트 모달로 인터셉트
    if (!isCrewStaff) {
      setCrewGateOpen(true);
      return;
    }
    setRegisteringStore(true);
    try {
      const res = await fetch("/api/store/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          colorId: selectedColor,
          designLayers: currentColorLayers,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "등록 실패");
      }
      posthog.capture("store_goods_registered", {
        product_id: productId,
        color: selectedColor,
      });
      toast.success("우리 크루 상점에 등록되었습니다!");
      // toast 의존 폐지 — 상점 관리로 즉시 이동
      router.push(`/store/${json.data.storeToken}/manage`);
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "크루 상품 등록에 실패했습니다.",
      );
    } finally {
      setRegisteringStore(false);
    }
  };

  return (
    <div className='w-full lg:w-[380px] bg-white border-t lg:border-t-0 lg:border-l lg:h-[calc(100vh-64px)] lg:overflow-y-auto flex flex-col'>
      <div className='p-4 space-y-3 flex-1'>
        {/* Header */}
        <div className='space-y-0.5'>
          <h2 className='text-lg font-bold text-gray-900'>{displayName}</h2>
        </div>

        <Separator />

        {/* Color Selection */}
        <div className='space-y-2'>
          <Label className='text-[10px] text-gray-500 font-bold uppercase'>
            {t("common.color")} - {selectedColorData?.label}
          </Label>
          <div className='flex flex-wrap gap-1.5'>
            {colors.map((c) => {
              const hasDesign = colorsWithDesign.includes(c.id);
              return (
                <div key={c.id} className='relative'>
                  <button
                    onClick={() => onColorChange(c.id)}
                    className={`w-10 h-10 lg:w-8 lg:h-8 rounded-full border-2 transition-all ${
                      selectedColor === c.id
                        ? "ring-2 ring-black ring-offset-1 border-transparent"
                        : "border-gray-200 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                  {hasDesign && (
                    <div className='absolute -top-0.5 -right-0.5 bg-blue-500 rounded-full w-3 h-3 flex items-center justify-center'>
                      <Palette className='w-2 h-2 text-white' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {colorsWithDesign.length > 0 && (
            <p className='text-[10px] text-blue-600'>
              <Palette className='w-2.5 h-2.5 inline mr-0.5' />
              {colorsWithDesign.length}개 색상에 디자인이 있습니다
            </p>
          )}
        </div>

        {/* Size Selection */}
        <div className='space-y-2'>
          <Label className='text-[10px] text-gray-500 font-bold uppercase'>
            {t("common.size")}
          </Label>
          <div
            className={`grid gap-1.5 ${
              sizes.length <= 3
                ? "grid-cols-3"
                : sizes.length === 4
                  ? "grid-cols-4"
                  : "grid-cols-5"
            }`}
          >
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-2.5 text-sm lg:py-1.5 lg:text-xs border rounded hover:border-black transition-colors ${
                  selectedSize === size
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity for new item */}
        <div className='space-y-2'>
          <Label className='text-[10px] text-gray-500 font-bold uppercase'>
            {t("common.quantity")}
          </Label>
          <div className='bg-gray-50 rounded p-2.5 space-y-2 border border-gray-100'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center bg-white border rounded'>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className='px-3.5 py-1.5 lg:px-2 lg:py-0.5 hover:bg-gray-100 border-r text-sm lg:text-xs'
                >
                  -
                </button>
                <span className='px-3 py-1.5 lg:px-2.5 lg:py-0.5 text-sm lg:text-xs font-medium min-w-[28px] lg:min-w-[24px] text-center'>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className='px-3.5 py-1.5 lg:px-2 lg:py-0.5 hover:bg-gray-100 border-l text-sm lg:text-xs'
                >
                  +
                </button>
              </div>
              <div className='text-right'>
                {isDiscounted ? (
                  <>
                    <span className='text-[10px] text-gray-400 line-through mr-0.5'>
                      {basePrice.toLocaleString()}원
                    </span>
                    <span className='text-xs font-bold text-orange-600'>
                      {currentUnitPrice.toLocaleString()}원
                    </span>
                    <span className='ml-0.5 text-[10px] text-red-500 font-semibold'>
                      -{discountRate}%
                    </span>
                  </>
                ) : (
                  <span className='text-xs font-bold'>
                    {basePrice.toLocaleString()}원
                  </span>
                )}
              </div>
            </div>

            {/* 현재 선택 소계 */}
            <div className='flex justify-between items-center pt-1.5 border-t border-gray-200'>
              <span className='text-[10px] text-gray-500'>
                {quantity}개 소계
              </span>
              <span className='text-sm font-bold text-gray-900'>
                {(currentUnitPrice * quantity).toLocaleString()}원
              </span>
            </div>

            {/* 할인 가격표 보기 버튼 */}
            {hasPriceTiers && (
              <button
                onClick={() => setPricingModalOpen(true)}
                className='w-full flex items-center justify-center gap-1 py-1.5 text-[10px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded transition-colors'
              >
                <Tag className='w-2.5 h-2.5' />
                대량 구매 할인 가격표 보기
              </button>
            )}
          </div>
        </div>

        {/* 현재 디자인 상태 표시 */}
        <div
          className={`p-2 rounded-lg border ${
            hasCurrentDesign
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          {hasCurrentDesign ? (
            <div className='flex items-center gap-1.5 text-xs text-green-700'>
              <Check className='w-3 h-3' />
              <span>
                현재 색상에 {currentColorLayers.length}개 레이어가 있습니다
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-1.5 text-xs text-yellow-700'>
              <Palette className='w-3 h-3' />
              <span>로고를 업로드하여 디자인을 시작하세요</span>
            </div>
          )}
        </div>

        {/* 우리 크루 상품으로 등록 — 유일한 primary CTA */}
        <Button
          onClick={handleRegisterToStore}
          disabled={!hasCurrentDesign || registeringStore}
          className={`w-full h-11 text-base lg:h-9 lg:text-sm rounded transform transition-all ${
            hasCurrentDesign
              ? "bg-black hover:bg-gray-900 hover:-translate-y-0.5"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <Store className='mr-1.5 h-3.5 w-3.5' />
          {!hasCurrentDesign
            ? "디자인을 먼저 추가하세요"
            : registeringStore
              ? "등록 중..."
              : "우리 크루 상품으로 등록"}
        </Button>
        <p className='text-[10px] leading-relaxed text-gray-400'>
          등록하면 우리 크루 상점에 굿즈로 올라가고, 링크를 공유해 크루원들의
          사이즈를 취합할 수 있어요.
        </p>

      </div>

      {/* 크루 게이트 모달 — 비크루가 등록을 누르면 */}
      <Dialog open={crewGateOpen} onOpenChange={setCrewGateOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>크루 상점 등록은 크루 운영진 계정으로</DialogTitle>
            <DialogDescription>
              {isCrewPending
                ? "크루 등록 신청이 승인 대기 중이에요. 승인이 완료되면 굿즈를 등록할 수 있습니다."
                : "RunHouse에 등록된 러닝크루로 로그인하면 이 디자인을 우리 크루 상점에 굿즈로 올릴 수 있어요."}
            </DialogDescription>
          </DialogHeader>
          {!isCrewPending && (
            <CrewLoginInline
              onSuccess={async () => {
                await refreshProfile();
                setCrewGateOpen(false);
                toast.success("크루 로그인 완료! 이제 등록할 수 있어요.");
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 할인 가격표 모달 */}
      {hasPriceTiers && (
        <PricingTableModal
          open={pricingModalOpen}
          onOpenChange={setPricingModalOpen}
          productName={displayName}
          basePrice={basePrice}
          priceTiers={priceTiers!}
        />
      )}
    </div>
  );
}
