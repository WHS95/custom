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
} from "lucide-react";
import { useStudioConfig, ProductColor } from "@/lib/store/studio-context";
import { useLanguage } from "@/lib/i18n/language-context";
import {
  useDesignStore,
  useCurrentColorLayers,
} from "@/lib/store/design-store";
import { useCartStore, CartItem } from "@/lib/store/cart-store";
import { toast } from "sonner";

interface ProductSidebarProps {
  productId?: string; // 상품 ID (UUID)
  selectedColor: string;
  onColorChange: (color: string) => void;
  productColors?: ProductColor[]; // 상품별 색상 (제공되면 config.colors 대신 사용)
  productBasePrice?: number; // 상품별 가격
  productName?: string; // 상품명
  productSizes?: string[]; // 상품별 사이즈 (제공되면 기본 SIZES 대신 사용)
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
    (color) => layersByColor[color] && layersByColor[color].length > 0
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

    addToCart({
      productId: productId || "custom-hat",
      productName: displayName,
      color: selectedColor,
      colorLabel: selectedColorData?.label || selectedColor,
      size: selectedSize,
      quantity: quantity,
      designLayers: [...currentColorLayers],
      unitPrice: basePrice,
    });

    toast.success("장바구니에 추가되었습니다", {
      description: `${selectedColorData?.label} / ${selectedSize} / ${quantity}개`,
    });

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
    e: React.MouseEvent
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
      <div className='p-6 space-y-5 flex-1'>
        {/* Header */}
        <div className='space-y-1'>
          <div className='flex justify-between items-start'>
            <h2 className='text-xl font-bold text-gray-900'>{displayName}</h2>
            {totalCartItems > 0 && (
              <div className='relative'>
                <ShoppingCart className='h-5 w-5 text-gray-600' />
                <span className='absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center'>
                  {totalCartItems}
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Color Selection */}
        <div className='space-y-3'>
          <Label className='text-xs text-gray-500 font-bold uppercase'>
            {t("common.color")} - {selectedColorData?.label}
          </Label>
          <div className='flex gap-2'>
            {colors.map((c) => {
              const hasDesign = colorsWithDesign.includes(c.id);
              return (
                <div key={c.id} className='relative'>
                  <button
                    onClick={() => onColorChange(c.id)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === c.id
                        ? "ring-2 ring-black ring-offset-2 border-transparent"
                        : "border-gray-200 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                  {hasDesign && (
                    <div className='absolute -top-1 -right-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center'>
                      <Palette className='w-2.5 h-2.5 text-white' />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {colorsWithDesign.length > 0 && (
            <p className='text-xs text-blue-600'>
              <Palette className='w-3 h-3 inline mr-1' />
              {colorsWithDesign.length}개 색상에 디자인이 있습니다
            </p>
          )}
        </div>

        {/* Size Selection */}
        <div className='space-y-3'>
          <div className='flex justify-between items-center'>
            <Label className='text-xs text-gray-500 font-bold uppercase'>
              {t("common.size")}
            </Label>
            <span className='text-xs text-gray-400 underline cursor-pointer'>
              {t("common.sizeGuide")}
            </span>
          </div>
          <div
            className={`grid gap-2 ${
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
                className={`py-2 text-sm border rounded hover:border-black transition-colors ${
                  selectedSize === size
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <div className='bg-gray-50 p-2 text-xs text-gray-500 rounded'>
            {t("product.description")}
          </div>
        </div>

        {/* Quantity for new item */}
        <div className='space-y-3'>
          <Label className='text-xs text-gray-500 font-bold uppercase'>
            {t("common.quantity")}
          </Label>
          <div className='bg-gray-50 rounded p-4 flex justify-between items-center border border-gray-100'>
            <div className='text-sm font-medium'>
              {t("product.customHat")}
              <span className='text-gray-400'>| {selectedSize}</span>
            </div>
            <div className='flex items-center bg-white border rounded'>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className='px-3 py-1 hover:bg-gray-100 border-r'
              >
                -
              </button>
              <span className='px-3 py-1 text-sm font-medium min-w-[30px] text-center'>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className='px-3 py-1 hover:bg-gray-100 border-l'
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* 현재 디자인 상태 표시 */}
        <div
          className={`p-3 rounded-lg border ${
            hasCurrentDesign
              ? "bg-green-50 border-green-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          {hasCurrentDesign ? (
            <div className='flex items-center gap-2 text-sm text-green-700'>
              <Check className='w-4 h-4' />
              <span>
                현재 색상에 {currentColorLayers.length}개 레이어가 있습니다
              </span>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-sm text-yellow-700'>
              <Palette className='w-4 h-4' />
              <span>로고를 업로드하여 디자인을 시작하세요</span>
            </div>
          )}
        </div>

        {/* 장바구니 담기 버튼 */}
        <Button
          onClick={handleAddToCart}
          disabled={!hasCurrentDesign}
          className={`w-full h-11 text-base rounded transform transition-all ${
            hasCurrentDesign
              ? "bg-black hover:bg-gray-900 hover:-translate-y-0.5"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          <ShoppingBag className='mr-2 h-4 w-4' />
          {hasCurrentDesign
            ? t("common.addToCart")
            : "디자인을 먼저 추가하세요"}
        </Button>

        {/* 장바구니 목록 - 항상 수량 조절 가능 */}
        {cartItems.length > 0 && (
          <>
            <Separator />
            <div className='space-y-3'>
              <div className='flex justify-between items-center'>
                <Label className='text-xs text-gray-500 font-bold uppercase flex items-center gap-2'>
                  <ShoppingCart className='w-4 h-4' />
                  장바구니 ({totalCartItems}개)
                </Label>
                <span className='text-sm font-bold'>
                  {totalCartPrice.toLocaleString()} KRW
                </span>
              </div>

              <div className='space-y-2 max-h-[280px] overflow-y-auto pr-1'>
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className='bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-gray-300 transition-all'
                  >
                    {/* 아이템 정보 - 클릭 시 해당 디자인으로 이동 */}
                    <div
                      onClick={() => handleCartItemClick(item)}
                      className='flex items-center gap-2 cursor-pointer group mb-2'
                    >
                      <div
                        className='w-6 h-6 rounded-full border-2 shadow-sm flex-shrink-0'
                        style={{
                          backgroundColor:
                            colors.find((c) => c.id === item.color)?.hex ||
                            "#000",
                        }}
                      />
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium truncate group-hover:text-blue-600 transition-colors'>
                          {item.colorLabel}
                        </p>
                        <p className='text-xs text-gray-500'>
                          사이즈: {item.size}
                        </p>
                      </div>
                    </div>

                    {/* 수량 조정 - 항상 표시 */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center bg-white border rounded shadow-sm'>
                        <button
                          onClick={(e) =>
                            handleQuantityChange(item.id, item.quantity - 1, e)
                          }
                          className='px-2 py-1 hover:bg-gray-100 rounded-l transition-colors border-r'
                        >
                          <Minus className='w-3 h-3' />
                        </button>
                        <span className='px-3 py-1 text-sm font-bold min-w-[32px] text-center'>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) =>
                            handleQuantityChange(item.id, item.quantity + 1, e)
                          }
                          className='px-2 py-1 hover:bg-gray-100 rounded-r transition-colors border-l'
                        >
                          <Plus className='w-3 h-3' />
                        </button>
                      </div>

                      <div className='flex items-center gap-2'>
                        <span className='text-sm font-bold'>
                          {(item.unitPrice * item.quantity).toLocaleString()}원
                        </span>
                        <button
                          onClick={(e) => handleRemoveItem(item.id, e)}
                          className='p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer - 총 합계 */}
      {totalCartItems > 0 && (
        <div className='p-6 border-t bg-gray-50 space-y-3'>
          <div className='space-y-1'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>상품 합계</span>
              <span>{totalCartPrice.toLocaleString()} KRW</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>배송비</span>
              <span>{totalCartPrice >= 50000 ? "무료" : "3,000 KRW"}</span>
            </div>
          </div>
          <Separator />
          <div className='flex justify-between items-end'>
            <span className='text-sm font-medium'>총 결제금액</span>
            <span className='text-xl font-bold'>
              {(
                totalCartPrice + (totalCartPrice >= 50000 ? 0 : 3000)
              ).toLocaleString()}{" "}
              KRW
            </span>
          </div>
          <Button
            onClick={() => router.push("/cart")}
            className='w-full h-11 bg-blue-600 hover:bg-blue-700 rounded'
          >
            장바구니로 이동 ({totalCartItems}개)
          </Button>
        </div>
      )}
    </div>
  );
}
