"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Heart, Share2, ShoppingBag } from "lucide-react"
import { useStudioConfig } from "@/lib/store/studio-context"
import { useLanguage } from "@/lib/i18n/language-context"

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

  const selectedColorData = config.colors.find(c => c.id === selectedColor)


  return (
    <div className="w-[380px] bg-white border-l h-[calc(100vh-64px)] overflow-y-auto flex flex-col">
      <div className="p-6 space-y-6 flex-1">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold text-gray-900">{t('product.name')}</h2>
            {/* <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8"><Share2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Heart className="h-4 w-4" /></Button>
            </div> */}
          </div>
          <p className="text-lg font-bold">{config.basePrice.toLocaleString()} KRW</p>
          {/* <div className="flex items-center gap-1 text-sm text-yellow-500">
             <span>★ 4.9</span>
             <span className="text-gray-400 underline ml-1 cursor-pointer">22 {t('common.reviews')}</span>
          </div> */}
        </div>

        <Separator />

        {/* Color Selection */}
        <div className="space-y-3">
          <Label className="text-xs text-gray-500 font-bold uppercase">{t('common.color')} - {selectedColorData?.label}</Label>
          <div className="flex gap-2">
            {config.colors.map((c) => (
              <button
                key={c.id}
                onClick={() => onColorChange(c.id)}
                className={`w-8 h-8 rounded-full border border-gray-200 transition-all ${
                  selectedColor === c.id ? "ring-2 ring-black ring-offset-2" : "hover:scale-110"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
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
                <div className="text-sm font-medium">{t('product.customHat')} <span className="text-gray-400">| {selectedSize}</span></div>
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
      </div>

      {/* Footer / CTA */}
      <div className="p-6 border-t bg-white space-y-4">
        <div className="flex justify-between items-end">
            <span className="text-sm text-gray-500 font-medium">{t('common.total')}</span>
            <span className="text-2xl font-bold tracking-tight">{(config.basePrice * quantity + 3000 - (quantity >= 10 ? 15000 : 0)).toLocaleString()} KRW</span>
        </div>
        <Button className="w-full h-12 text-lg bg-black hover:bg-gray-900 rounded-none transform hover:-translate-y-1 transition-transform">
            <ShoppingBag className="mr-2 h-5 w-5" /> {t('common.addToCart')}
        </Button>
      </div>
    </div>
  )
}
