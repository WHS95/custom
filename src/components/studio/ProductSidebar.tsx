"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Check, Palette, Tag, Store, Image as ImageIcon, Type } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStudioConfig, ProductColor } from "@/lib/store/studio-context";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  useDesignStore,
  useCurrentColorLayers,
} from "@/lib/store/design-store";
import posthog from "posthog-js";
import type { PriceTier } from "@/domain/product/types";
import { PricingTableModal } from "./PricingTableModal";
import { ReviewRequestDialog } from "./ReviewRequestDialog";
import { ProposalDialog } from "./ProposalDialog";
import { DownloadDesignDialog } from "./DownloadDesignDialog";
import { Download } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
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
  const { isAuthenticated, profile } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const proposeToken = searchParams.get("propose"); // 크루원 제안 모드
  const [crewGateOpen, setCrewGateOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [proposalDialogOpen, setProposalDialogOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const isCrewStaff = isAuthenticated && profile?.user_type === "crew_staff";
  const isCrewPending = isAuthenticated && profile?.user_type === "crew_pending";

  // 상품별 색상이 제공되면 사용, 아니면 기본 config 사용
  const colors = productColors || config.colors;
  const basePrice = productBasePrice ?? config.basePrice;
  const displayName = productName || t("product.name");

  // 상품별 사이즈가 있으면 사용, 없으면 기본값 (안내용 — 선택은 상점에서 크루원이 함)
  const sizes =
    productSizes && productSizes.length > 0 ? productSizes : DEFAULT_SIZES;
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
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
   * 제작 가능 여부 확인 요청 (피벗 후 유일한 primary 액션 — 등록 전 필수 게이트)
   */
  const handleRequestReview = () => {
    if (!hasCurrentDesign || !productId) return;
    // 크루원 제안 모드(?propose=storeToken): 로그인 없이 제안
    if (proposeToken) {
      setProposalDialogOpen(true);
      return;
    }
    // 비크루는 게이트 모달로 인터셉트
    if (!isCrewStaff) {
      setCrewGateOpen(true);
      return;
    }
    posthog.capture("manufacture_review_requested", {
      product_id: productId,
      color: selectedColor,
    });
    setReviewDialogOpen(true);
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
                    className={`w-10 h-10 lg:w-8 lg:h-8 rounded-full border-2 transition-[transform,border-color,box-shadow] duration-150 ease-out active:scale-95 ${
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

        {/* 가격 안내 — 사이즈·수량은 상점에서 크루원이 정함 */}
        <div className='space-y-2'>
          <Label className='text-[10px] text-gray-500 font-bold uppercase'>
            단가 안내
          </Label>
          <div className='bg-gray-50 rounded p-2.5 space-y-2 border border-gray-100'>
            <div className='flex justify-between items-center'>
              <span className='text-[10px] text-gray-500'>1장당</span>
              <span className='text-sm font-bold text-gray-900'>
                {basePrice.toLocaleString()}원
              </span>
            </div>
            {sizes.length > 0 && (
              <div className='flex justify-between items-center pt-1.5 border-t border-gray-200'>
                <span className='text-[10px] text-gray-500'>제공 사이즈</span>
                <span className='text-[11px] font-medium text-gray-700'>
                  {sizes.join(" · ")}
                </span>
              </div>
            )}
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
            <p className='text-[10px] leading-relaxed text-gray-400 pt-0.5'>
              사이즈·수량은 상점에서 크루원이 직접 선택해요. 여기선 디자인만
              완성하면 됩니다.
            </p>
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
            <div className='space-y-2 text-xs text-yellow-800'>
              <div className='flex items-center gap-1.5 font-bold'>
                <Palette className='w-3.5 h-3.5' />
                <span>이렇게 디자인을 추가해요</span>
              </div>
              <ol className='space-y-1.5 pl-0.5'>
                <li className='flex items-start gap-1.5'>
                  <span className='font-bold'>1.</span>
                  <span className='flex flex-wrap items-center gap-1'>
                    상단 툴바에서
                    <span className='inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 font-medium text-gray-700 border border-yellow-200'>
                      <ImageIcon className='w-3 h-3' /> 로고
                    </span>
                    업로드 또는
                    <span className='inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 font-medium text-gray-700 border border-yellow-200'>
                      <Type className='w-3 h-3' /> 텍스트
                    </span>
                    추가
                  </span>
                </li>
                <li className='flex items-start gap-1.5'>
                  <span className='font-bold'>2.</span>
                  <span>캔버스에서 드래그로 위치·크기를 맞춰요</span>
                </li>
              </ol>
              <p className='text-[11px] text-yellow-700/80'>
                디자인을 추가하면 아래 버튼이 활성화돼요.
              </p>
            </div>
          )}
        </div>

        {/* 제작 가능 여부 확인 요청 — 유일한 primary CTA (등록 전 필수 게이트) */}
        <Button
          onClick={handleRequestReview}
          disabled={!hasCurrentDesign}
          className={`w-full h-11 text-base lg:h-9 lg:text-sm rounded ${
            hasCurrentDesign
              ? "bg-black hover:bg-gray-900 hover:-translate-y-0.5 active:translate-y-0"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <Store className='mr-1.5 h-3.5 w-3.5' />
          {!hasCurrentDesign
            ? "디자인을 먼저 추가하세요"
            : proposeToken
              ? "우리 크루에 제안하기"
              : "제작 가능 여부 확인 요청"}
        </Button>
        <p className='text-[10px] leading-relaxed text-gray-400'>
          {proposeToken
            ? "만든 디자인을 크루 운영진에게 제안해요. 채택되면 공장 확인을 거쳐 상점에 올라가요."
            : "공장에서 제작 가능한지 먼저 확인해요. 승인되면 ‘내 제작 문의’에서 우리 크루 상점에 굿즈로 등록할 수 있어요."}
        </p>

        {/* PNG 다운로드 — 무로그인, 인스타 스토리용 */}
        <Button
          variant="outline"
          onClick={() => setDownloadOpen(true)}
          disabled={!hasCurrentDesign}
          className="w-full h-10 gap-1.5 rounded lg:h-9 lg:text-sm"
        >
          <Download className="h-4 w-4" />
          PNG 다운로드 (스토리용)
        </Button>

      </div>

      {/* PNG 다운로드 다이얼로그 (무로그인) */}
      <DownloadDesignDialog
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        designLayers={currentColorLayers}
        designColor={
          selectedColorData
            ? {
                id: selectedColorData.id,
                label: selectedColorData.label,
                hex: selectedColorData.hex,
                views: selectedColorData.views as Record<string, string>,
              }
            : null
        }
        productName={displayName}
      />

      {/* 크루원 제안 다이얼로그 (?propose 모드) */}
      {productId && proposeToken && (
        <ProposalDialog
          open={proposalDialogOpen}
          onOpenChange={setProposalDialogOpen}
          storeToken={proposeToken}
          productId={productId}
          colorId={selectedColor}
          designLayers={currentColorLayers}
        />
      )}

      {/* 제작 문의 다이얼로그 (크루) */}
      {productId && (
        <ReviewRequestDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          productId={productId}
          colorId={selectedColor}
          designLayers={currentColorLayers}
        />
      )}

      {/* 크루 게이트 모달 — 비크루가 요청을 누르면 */}
      <Dialog open={crewGateOpen} onOpenChange={setCrewGateOpen}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>크루 상점 등록은 크루 운영진 계정으로</DialogTitle>
            <DialogDescription>
              {isCrewPending
                ? "크루 등록 신청이 승인 대기 중이에요. 승인이 완료되면 굿즈를 등록할 수 있습니다."
                : "크루로 로그인하거나 가입하면 이 디자인을 우리 크루 상점에 굿즈로 올릴 수 있어요."}
            </DialogDescription>
          </DialogHeader>
          {!isCrewPending && (
            <div className="space-y-3">
              <div className="rounded-lg border border-hairline bg-soft-cloud p-3 text-xs text-muted-foreground">
                크루 회원가입은 <span className="font-semibold text-ink">무료</span>이고,
                가입 즉시 상점 개설·제작 문의가 가능해요. (10% 할인은 관리자 승인 후)
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                    크루 로그인
                  </Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/signup">크루 회원가입</Link>
                </Button>
              </div>
            </div>
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
