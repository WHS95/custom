"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  Check,
  Palette,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";
import { useStudioConfig, ProductColor } from "@/lib/store/studio-context";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  useDesignStore,
  useCurrentColorLayers,
} from "@/lib/store/design-store";
import { useCartStore, CartItem } from "@/lib/store/cart-store";
import { toast } from "sonner";
import type { PriceTier } from "@/domain/product/types";
import { getUnitPrice, getDiscountRate } from "@/lib/pricing/price-calculator";
import { PricingTableModal } from "./PricingTableModal";

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
  const setSelectedColor = useDesignStore((state) => state.setSelectedColor);

  // 장바구니 스토어
  const addToCart = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const selectedColorData = colors.find((c) => c.id === selectedColor);

  // 현재 색상에 디자인이 있는지 확인
  const hasCurrentDesign = currentColorLayers.length > 0;

  // 디자인이 있는 색상들
  const colorsWithDesign = Object.keys(layersByColor).filter(
    (color) => layersByColor[color] && layersByColor[color].length > 0,
  );

  /**
   * 장바구니에 현재 디자인 추가
   */
  const handleAddToCart = () => {
    if (!hasCurrentDesign) {
      toast.error("디자인을 먼저 추가해주세요", {
        description:
          "로고나 텍스트를 모자에 배치한 후 장바구니에 담을 수 있습니다.",
      });
      return;
    }

    const result = addToCart({
      productId: productId || "custom-hat",
      productName: displayName,
      color: selectedColor,
      colorLabel: selectedColorData?.label || selectedColor,
      colorHex: selectedColorData?.hex,
      size: selectedSize,
      quantity: quantity,
      designLayers: [...currentColorLayers],
      unitPrice: currentUnitPrice,
      basePrice: basePrice,
      priceTiers: priceTiers || undefined,
    });

    if (result.merged) {
      toast.success(
        `${selectedColorData?.label} / ${selectedSize} 수량이 ${result.newQuantity}개로 변경됨`,
      );
    } else {
      toast.success("장바구니에 추가되었습니다", {
        description: `${selectedColorData?.label} / ${selectedSize} / ${quantity}개`,
      });
    }

    setQuantity(1);
  };

  /**
   * 장바구니 아이템 클릭 시 해당 디자인으로 이동
   */
  const handleCartItemClick = (item: CartItem) => {
    onColorChange(item.color);
    setSelectedColor(item.color);

    toast.info(`${item.colorLabel} 디자인으로 이동했습니다`, {
      description: `사이즈: ${item.size} / 수량: ${item.quantity}개`,
    });
  };

  /**
   * 장바구니 아이템 수량 변경
   */
  const handleQuantityChange = (
    itemId: string,
    newQuantity: number,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (newQuantity <= 0) {
      removeItem(itemId);
      toast.info("아이템이 삭제되었습니다");
    } else {
      updateItemQuantity(itemId, newQuantity);
    }
  };

  /**
   * 장바구니 아이템 삭제
   */
  const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeItem(itemId);
    toast.info("아이템이 삭제되었습니다");
  };

  const totalCartItems = getTotalItems();
  const totalCartPrice = getTotalPrice();

  return (
    <div className='w-[380px] bg-white border-l h-[calc(100vh-64px)] overflow-y-auto flex flex-col'>
      <div className='p-4 space-y-3 flex-1'>
        {/* Header */}
        <div className='space-y-0.5'>
          <div className='flex justify-between items-start'>
            <h2 className='text-lg font-bold text-gray-900'>{displayName}</h2>
            {totalCartItems > 0 && (
              <div className='relative'>
                <ShoppingCart className='h-4 w-4 text-gray-600' />
                <span className='absolute -top-1 -right-1 bg-black text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center'>
                  {totalCartItems}
                </span>
              </div>
            )}
          </div>
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
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
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
                className={`py-1.5 text-xs border rounded hover:border-black transition-colors ${
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
                  className='px-2 py-0.5 hover:bg-gray-100 border-r text-xs'
                >
                  -
                </button>
                <span className='px-2.5 py-0.5 text-xs font-medium min-w-[24px] text-center'>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className='px-2 py-0.5 hover:bg-gray-100 border-l text-xs'
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

        {/* 장바구니 담기 버튼 */}
        <Button
          onClick={handleAddToCart}
          disabled={!hasCurrentDesign}
          className={`w-full h-9 text-sm rounded transform transition-all ${
            hasCurrentDesign
              ? "bg-black hover:bg-gray-900 hover:-translate-y-0.5"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <ShoppingBag className='mr-1.5 h-3.5 w-3.5' />
          {hasCurrentDesign
            ? t("common.addToCart")
            : "디자인을 먼저 추가하세요"}
        </Button>

        {/* 장바구니 목록 - 색상별 그룹핑 */}
        {cartItems.length > 0 && (
          <>
            <Separator />
            <div className='space-y-2'>
              <div className='flex justify-between items-center'>
                <Label className='text-[10px] text-gray-500 font-bold uppercase flex items-center gap-1'>
                  <ShoppingCart className='w-3 h-3' />
                  장바구니 ({totalCartItems}개)
                </Label>
                <span className='text-xs font-bold'>
                  {totalCartPrice.toLocaleString()} KRW
                </span>
              </div>

              <div className='space-y-2 max-h-[320px] overflow-y-auto pr-1'>
                {/* 색상별 그룹핑 */}
                {Object.entries(
                  cartItems.reduce(
                    (groups, item) => {
                      if (!groups[item.color]) groups[item.color] = [];
                      groups[item.color].push(item);
                      return groups;
                    },
                    {} as Record<string, CartItem[]>,
                  ),
                ).map(([colorId, colorItems]) => {
                  const colorData = colors.find((c) => c.id === colorId);
                  const colorHex = colorData?.hex || "#000";
                  const colorLabel = colorItems[0]?.colorLabel || colorId;

                  return (
                    <div
                      key={colorId}
                      className='bg-gray-50 rounded-lg border border-gray-100 overflow-hidden'
                    >
                      {/* 색상 그룹 헤더 - 클릭 시 해당 색상 디자인으로 이동 */}
                      <button
                        onClick={() => {
                          onColorChange(colorId);
                          setSelectedColor(colorId);
                          toast.info(`${colorLabel} 디자인으로 이동했습니다`);
                        }}
                        className='w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-gray-100 transition-colors group'
                      >
                        <div
                          className='w-4 h-4 rounded-full border-2 shadow-sm flex-shrink-0'
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className='text-xs font-bold text-gray-700 group-hover:text-blue-600 transition-colors truncate'>
                          {colorLabel}
                        </span>
                        <span className='text-[10px] text-gray-400 ml-auto flex-shrink-0'>
                          {colorItems.length > 1
                            ? `${colorItems.length}건`
                            : ""}
                        </span>
                      </button>

                      {/* 해당 색상의 아이템들 */}
                      <div className='border-t border-gray-100'>
                        {colorItems.map((item, idx) => (
                          <div
                            key={item.id}
                            className={`px-2.5 py-1.5 ${
                              idx > 0 ? "border-t border-gray-100" : ""
                            }`}
                          >
                            <div className='flex items-center justify-between'>
                              {/* 사이즈 표시 */}
                              <span className='text-[10px] text-gray-500 font-medium w-8 flex-shrink-0'>
                                {item.size}
                              </span>

                              {/* 수량 조정 */}
                              <div className='flex items-center bg-white border rounded shadow-sm'>
                                <button
                                  onClick={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity - 1,
                                      e,
                                    )
                                  }
                                  className='px-1.5 py-0.5 hover:bg-gray-100 rounded-l transition-colors border-r'
                                >
                                  <Minus className='w-2.5 h-2.5' />
                                </button>
                                <span className='px-2 py-0.5 text-xs font-bold min-w-[24px] text-center'>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={(e) =>
                                    handleQuantityChange(
                                      item.id,
                                      item.quantity + 1,
                                      e,
                                    )
                                  }
                                  className='px-1.5 py-0.5 hover:bg-gray-100 rounded-r transition-colors border-l'
                                >
                                  <Plus className='w-2.5 h-2.5' />
                                </button>
                              </div>

                              {/* 가격 + 삭제 */}
                              <div className='flex items-center gap-1'>
                                <span className='text-xs font-bold'>
                                  {(
                                    item.unitPrice * item.quantity
                                  ).toLocaleString()}
                                  원
                                </span>
                                <button
                                  onClick={(e) => handleRemoveItem(item.id, e)}
                                  className='p-0.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors'
                                >
                                  <Trash2 className='w-2.5 h-2.5' />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer - 총 합계 */}
      {totalCartItems > 0 && (
        <div className='p-4 border-t bg-gray-50 space-y-2'>
          <div className='space-y-0.5'>
            <div className='flex justify-between text-xs'>
              <span className='text-gray-500'>상품 합계</span>
              <span>{totalCartPrice.toLocaleString()} KRW</span>
            </div>
            <div className='flex justify-between text-xs'>
              <span className='text-gray-500'>배송비</span>
              <span>{totalCartPrice >= 50000 ? "무료" : "3,000 KRW"}</span>
            </div>
          </div>
          <Separator />
          <div className='flex justify-between items-end'>
            <span className='text-xs font-medium'>총 결제금액</span>
            <span className='text-base font-bold'>
              {(
                totalCartPrice + (totalCartPrice >= 50000 ? 0 : 3000)
              ).toLocaleString()}{" "}
              KRW
            </span>
          </div>
          <Button
            onClick={() => router.push("/cart")}
            className='w-full h-9 bg-blue-600 hover:bg-blue-700 rounded text-sm'
          >
            장바구니로 이동 ({totalCartItems}개)
          </Button>
        </div>
      )}

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
