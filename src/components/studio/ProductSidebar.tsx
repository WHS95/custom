"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, ShoppingBag, Check, Palette, ShoppingCart, X, Eye, Minus, Plus, Trash2 } from "lucide-react"
import { useStudioConfig } from "@/lib/store/studio-context"
import { useLanguage } from "@/lib/i18n/language-context"
import { useDesignStore, useCurrentColorLayers, DesignLayer } from "@/lib/store/design-store"
import { useCartStore, CartItem } from "@/lib/store/cart-store"
import { toast } from "sonner"

interface ProductSidebarProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

const SIZES = ["S", "M", "L", "XL", "FREE"]

export function ProductSidebar({ selectedColor, onColorChange }: ProductSidebarProps) {
  const { config } = useStudioConfig()
  const { t } = useLanguage()
  const [selectedSize, setSelectedSize] = useState("FREE")
  const [quantity, setQuantity] = useState(1)
  const [showCartDetail, setShowCartDetail] = useState(false)

  // 디자인 스토어에서 색상별 디자인 정보 가져오기
  const layersByColor = useDesignStore((state) => state.layersByColor)
  const currentColorLayers = useCurrentColorLayers()
  const setSelectedColor = useDesignStore((state) => state.setSelectedColor)
  
  // 장바구니 스토어
  const addToCart = useCartStore((state) => state.addItem)
  const cartItems = useCartStore((state) => state.items)
  const getTotalItems = useCartStore((state) => state.getTotalItems)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity)
  const removeItem = useCartStore((state) => state.removeItem)

  const selectedColorData = config.colors.find(c => c.id === selectedColor)
  
  // 현재 색상에 디자인이 있는지 확인
  const hasCurrentDesign = currentColorLayers.length > 0
  
  // 디자인이 있는 색상들
  const colorsWithDesign = Object.keys(layersByColor).filter(
    color => layersByColor[color] && layersByColor[color].length > 0
  )

  /**
   * 장바구니에 현재 디자인 추가
   */
  const handleAddToCart = () => {
    if (!hasCurrentDesign) {
      toast.error("디자인을 먼저 추가해주세요", {
        description: "로고나 텍스트를 모자에 배치한 후 장바구니에 담을 수 있습니다."
      })
      return
    }

    addToCart({
      productId: 'custom-hat',
      productName: t('product.name'),
      color: selectedColor,
      colorLabel: selectedColorData?.label || selectedColor,
      size: selectedSize,
      quantity: quantity,
      designLayers: [...currentColorLayers], // 현재 색상의 디자인 복사
      unitPrice: config.basePrice,
    })

    toast.success("장바구니에 추가되었습니다", {
      description: `${selectedColorData?.label} / ${selectedSize} / ${quantity}개`
    })

    // 수량 초기화
    setQuantity(1)
  }

  /**
   * 장바구니 아이템 클릭 시 해당 디자인으로 이동
   */
  const handleCartItemClick = (item: CartItem) => {
    // 해당 색상으로 전환
    onColorChange(item.color)
    setSelectedColor(item.color)
    
    toast.info(`${item.colorLabel} 디자인으로 이동했습니다`, {
      description: `사이즈: ${item.size} / 수량: ${item.quantity}개`
    })
  }

  /**
   * 장바구니 아이템 수량 변경
   */
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      toast.info("아이템이 삭제되었습니다")
    } else {
      updateItemQuantity(itemId, newQuantity)
    }
  }

  /**
   * 장바구니 아이템 삭제
   */
  const handleRemoveItem = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeItem(itemId)
    toast.info("아이템이 삭제되었습니다")
  }

  // 장바구니 총 아이템 수
  const totalCartItems = getTotalItems()
  const totalCartPrice = getTotalPrice()

  return (
    <div className="w-[380px] bg-white border-l h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
      <div className="p-6 space-y-6 flex-1">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">{t('product.name')}</h2>
            {/* 장바구니 아이콘 (클릭 시 상세 보기 토글) */}
            {totalCartItems > 0 && (
              <button 
                onClick={() => setShowCartDetail(!showCartDetail)}
                className="relative p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ShoppingCart className="h-5 w-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {totalCartItems}
                </span>
              </button>
            )}
          </div>
          <p className="text-lg font-bold">{config.basePrice.toLocaleString()} KRW</p>
        </div>

        <Separator />

        {/* 장바구니 상세 보기 (토글) */}
        {showCartDetail && cartItems.length > 0 && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-bold">장바구니 ({totalCartItems}개)</Label>
              <button 
                onClick={() => setShowCartDetail(false)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* 아이템 정보 - 클릭 시 해당 디자인으로 이동 */}
                  <div 
                    onClick={() => handleCartItemClick(item)}
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors mb-2"
                  >
                    <div 
                      className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                      style={{ backgroundColor: config.colors.find(c => c.id === item.color)?.hex || '#000' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.colorLabel}</p>
                      <p className="text-xs text-gray-500">사이즈: {item.size}</p>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {/* 수량 조정 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-gray-100 rounded">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuantityChange(item.id, item.quantity - 1)
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-l transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-sm font-medium min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuantityChange(item.id, item.quantity + 1)
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded-r transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {(item.unitPrice * item.quantity).toLocaleString()} KRW
                      </span>
                      <button 
                        onClick={(e) => handleRemoveItem(item.id, e)}
                        className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 장바구니 합계 */}
            <div className="pt-2 border-t">
              <div className="flex justify-between text-sm font-bold">
                <span>합계</span>
                <span>{totalCartPrice.toLocaleString()} KRW</span>
              </div>
            </div>
          </div>
        )}

        {/* Color Selection */}
        <div className="space-y-3">
          <Label className="text-xs text-gray-500 font-bold uppercase">{t('common.color')} - {selectedColorData?.label}</Label>
          <div className="flex gap-2">
            {config.colors.map((c) => {
              const hasDesign = colorsWithDesign.includes(c.id)
              return (
                <div key={c.id} className="relative">
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
                  {/* 디자인이 있는 색상 표시 */}
                  {hasDesign && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full w-4 h-4 flex items-center justify-center">
                      <Palette className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {colorsWithDesign.length > 0 && (
            <p className="text-xs text-blue-600">
              <Palette className="w-3 h-3 inline mr-1" />
              {colorsWithDesign.length}개 색상에 디자인이 있습니다
            </p>
          )}
        </div>

        {/* Size Selection */}
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label className="text-xs text-gray-500 font-bold uppercase">{t('common.size')}</Label>
                <span className="text-xs text-gray-400 underline cursor-pointer">{t('common.sizeGuide')}</span>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {SIZES.map((size) => (
                    <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 text-sm border rounded hover:border-black transition-colors ${
                            selectedSize === size ? "bg-black text-white border-black" : "bg-white text-gray-700"
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>
            <div className="bg-gray-50 p-2 text-xs text-gray-500 rounded">
                {t('product.description')}
            </div>
        </div>

        {/* Quantity */}
        <div className="space-y-3">
            <Label className="text-xs text-gray-500 font-bold uppercase">{t('common.quantity')}</Label>
            <div className="bg-gray-50 rounded p-4 flex justify-between items-center border border-gray-100">
                <div className="text-sm font-medium">
                  {t('product.customHat')} 
                  <span className="text-gray-400">| {selectedSize}</span>
                </div>
                <div className="flex items-center bg-white border rounded">
                    <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 hover:bg-gray-100 border-r"
                    >-</button>
                    <span className="px-3 py-1 text-sm font-medium min-w-[30px] text-center">{quantity}</span>
                    <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100 border-l"
                    >+</button>
                </div>
            </div>
        </div>

        {/* 현재 디자인 상태 표시 */}
        <div className={`p-3 rounded-lg border ${hasCurrentDesign ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          {hasCurrentDesign ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Check className="w-4 h-4" />
              <span>현재 색상에 {currentColorLayers.length}개 레이어가 있습니다</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-yellow-700">
              <Palette className="w-4 h-4" />
              <span>로고를 업로드하여 디자인을 시작하세요</span>
            </div>
          )}
        </div>

        {/* Pricing Summary */}
        <div className="space-y-2 pt-4">
             <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('common.itemSubtotal')}</span>
                <span>{(config.basePrice * quantity).toLocaleString()} KRW</span>
             </div>
             <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('common.shipping')}</span>
                <span>3,000 KRW</span>
             </div>
             {quantity >= 10 && (
                <div className="flex justify-between text-sm text-blue-600">
                    <span>{t('common.bulkDiscount')} (10+)</span>
                    <span>-15,000 KRW</span>
                </div>
             )}
        </div>

        {/* 장바구니 아이템 미리보기 (간략) */}
        {!showCartDetail && cartItems.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-gray-500 font-bold uppercase">장바구니 ({totalCartItems}개)</Label>
              <button 
                onClick={() => setShowCartDetail(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                상세 보기
              </button>
            </div>
            <div className="space-y-1">
              {cartItems.slice(0, 3).map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleCartItemClick(item)}
                  className="flex justify-between text-xs bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: config.colors.find(c => c.id === item.color)?.hex || '#000' }}
                    />
                    <span className="text-gray-600">
                      {item.colorLabel} / {item.size}
                    </span>
                  </div>
                  <span className="font-medium">{item.quantity}개</span>
                </div>
              ))}
              {cartItems.length > 3 && (
                <button 
                  onClick={() => setShowCartDetail(true)}
                  className="text-xs text-gray-400 text-center w-full hover:text-gray-600"
                >
                  +{cartItems.length - 3}개 더 보기
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="p-6 border-t bg-white space-y-4">
        <div className="flex justify-between items-end">
            <span className="text-sm text-gray-500 font-medium">{t('common.total')}</span>
            <span className="text-2xl font-bold tracking-tight">
              {(config.basePrice * quantity + 3000 - (quantity >= 10 ? 15000 : 0)).toLocaleString()} KRW
            </span>
        </div>
        <Button 
          onClick={handleAddToCart}
          disabled={!hasCurrentDesign}
          className={`w-full h-12 text-lg rounded-none transform transition-all ${
            hasCurrentDesign 
              ? 'bg-black hover:bg-gray-900 hover:-translate-y-1' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
            <ShoppingBag className="mr-2 h-5 w-5" /> 
            {hasCurrentDesign ? t('common.addToCart') : '디자인을 먼저 추가하세요'}
        </Button>
        
        {/* 장바구니에 아이템이 있을 때 총 합계 표시 */}
        {totalCartItems > 0 && (
          <div className="text-center text-sm text-gray-500">
            장바구니 합계: <span className="font-bold text-black">{totalCartPrice.toLocaleString()} KRW</span>
            <span className="text-gray-400"> ({totalCartItems}개 상품)</span>
          </div>
        )}
      </div>
    </div>
  )
}
