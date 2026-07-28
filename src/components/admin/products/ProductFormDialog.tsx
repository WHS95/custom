"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";
import type {
  Product,
  ProductVariant,
  ProductCategory,
  PriceTier,
} from "@/domain/product/types";

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  basePrice: number;
  priceTiers: PriceTier[];
  variants: ProductVariant[];
  isActive: boolean;
}

const DEFAULT_FORM: ProductFormData = {
  name: "",
  slug: "",
  description: "",
  category: "hat",
  basePrice: 35000,
  priceTiers: [],
  variants: [{ id: "black", label: "Black", hex: "#000000", sizes: ["FREE"] }],
  isActive: true,
};

export interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  onSaved: () => void;
}

export default function ProductFormDialog({
  open,
  onOpenChange,
  editingProduct,
  onSaved,
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        slug: editingProduct.slug,
        description: editingProduct.description || "",
        category: editingProduct.category,
        basePrice: editingProduct.basePrice,
        priceTiers: editingProduct.priceTiers || [],
        variants: editingProduct.variants,
        isActive: editingProduct.isActive,
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
  }, [editingProduct]);

  const handleSave = async () => {
    if (!formData.name || !formData.slug) {
      toast.error("상품명과 슬러그는 필수입니다");
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        ...formData,
        priceTiers: formData.priceTiers.length > 0 ? formData.priceTiers : null,
      };

      if (editingProduct) {
        const res = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("상품이 수정되었습니다");
          onOpenChange(false);
          onSaved();
        } else {
          toast.error(json.error || "수정 실패");
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("상품이 생성되었습니다");
          onOpenChange(false);
          onSaved();
        } else {
          toast.error(json.error || "생성 실패");
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("저장 중 오류가 발생했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `color-${Date.now()}`,
      label: "New Color",
      hex: "#888888",
      sizes: ["FREE"],
    };
    setFormData({ ...formData, variants: [...formData.variants, newVariant] });
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: string | string[],
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handleRemoveVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const handleAddPriceTier = () => {
    const lastTier = formData.priceTiers[formData.priceTiers.length - 1];
    const newMinQty = lastTier ? lastTier.minQuantity + 10 : 1;
    const newPrice = lastTier
      ? Math.round(lastTier.unitPrice * 0.95)
      : formData.basePrice;
    setFormData({
      ...formData,
      priceTiers: [
        ...formData.priceTiers,
        { minQuantity: newMinQty, unitPrice: newPrice },
      ],
    });
  };

  const handleUpdatePriceTier = (
    index: number,
    field: keyof PriceTier,
    value: number,
  ) => {
    const newTiers = [...formData.priceTiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, priceTiers: newTiers });
  };

  const handleRemovePriceTier = (index: number) => {
    setFormData({
      ...formData,
      priceTiers: formData.priceTiers.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? "상품 수정" : "새 상품 추가"}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-6 py-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>상품명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder='예: 커스텀 캡'
              />
            </div>
            <div className='space-y-2'>
              <Label>슬러그 * (URL용)</Label>
              <Input
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder='예: custom-cap'
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>카테고리</Label>
              <Select
                value={formData.category}
                onValueChange={(v: ProductCategory) =>
                  setFormData({ ...formData, category: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='hat'>모자</SelectItem>
                  <SelectItem value='clothing'>의류</SelectItem>
                  <SelectItem value='accessory'>액세서리</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>기본 가격 (원)</Label>
              <Input
                type='number'
                value={formData.basePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basePrice: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label>설명</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder='상품 설명...'
              rows={3}
            />
          </div>

          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <Label>색상 옵션</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddVariant}
              >
                <Plus className='mr-1 h-3 w-3' /> 색상 추가
              </Button>
            </div>
            {formData.variants.map((variant, idx) => (
              <div key={idx} className='border rounded-lg p-4 space-y-3'>
                <div className='grid grid-cols-3 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-xs'>색상 ID</Label>
                    <Input
                      value={variant.id}
                      onChange={(e) =>
                        handleUpdateVariant(idx, "id", e.target.value)
                      }
                      placeholder='black'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>색상명</Label>
                    <Input
                      value={variant.label}
                      onChange={(e) =>
                        handleUpdateVariant(idx, "label", e.target.value)
                      }
                      placeholder='Black'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-xs'>HEX 코드</Label>
                    <div className='flex gap-2'>
                      <Input
                        type='color'
                        value={variant.hex}
                        onChange={(e) =>
                          handleUpdateVariant(idx, "hex", e.target.value)
                        }
                        className='w-12 h-9 p-1'
                      />
                      <Input
                        value={variant.hex}
                        onChange={(e) =>
                          handleUpdateVariant(idx, "hex", e.target.value)
                        }
                        className='flex-1'
                      />
                    </div>
                  </div>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='space-y-1 flex-1 mr-4'>
                    <Label className='text-xs'>사이즈 (쉼표 구분)</Label>
                    <Input
                      value={variant.sizes.join(", ")}
                      onChange={(e) =>
                        handleUpdateVariant(
                          idx,
                          "sizes",
                          e.target.value.split(",").map((s) => s.trim()),
                        )
                      }
                      placeholder='S, M, L, XL, FREE'
                    />
                  </div>
                  {formData.variants.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      className='text-red-500'
                      onClick={() => handleRemoveVariant(idx)}
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <div className='flex items-center gap-2'>
                <Tag className='h-4 w-4 text-orange-500' />
                <Label>대량 구매 할인 가격표</Label>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddPriceTier}
              >
                <Plus className='mr-1 h-3 w-3' /> 구간 추가
              </Button>
            </div>
            {formData.priceTiers.length === 0 ? (
              <div className='border border-dashed rounded-lg p-4 text-center text-sm text-gray-400'>
                할인 가격표가 없습니다. &quot;구간 추가&quot; 버튼을 눌러
                수량별 할인가를 설정하세요.
              </div>
            ) : (
              <div className='space-y-2'>
                <div className='grid grid-cols-[1fr_1fr_auto] gap-3 px-1'>
                  <Label className='text-xs text-gray-500'>
                    최소 수량 (개)
                  </Label>
                  <Label className='text-xs text-gray-500'>
                    개당 가격 (원)
                  </Label>
                  <div className='w-8' />
                </div>
                {formData.priceTiers
                  .slice()
                  .sort((a, b) => a.minQuantity - b.minQuantity)
                  .map((tier, idx) => {
                    const discountRate =
                      formData.basePrice > 0
                        ? Math.round(
                            ((formData.basePrice - tier.unitPrice) /
                              formData.basePrice) *
                              100,
                          )
                        : 0;
                    const actualIdx = formData.priceTiers.findIndex(
                      (t) =>
                        t.minQuantity === tier.minQuantity &&
                        t.unitPrice === tier.unitPrice,
                    );
                    return (
                      <div
                        key={idx}
                        className='grid grid-cols-[1fr_1fr_auto] gap-3 items-center border rounded-lg p-3'
                      >
                        <Input
                          type='number'
                          min={1}
                          value={tier.minQuantity}
                          onChange={(e) =>
                            handleUpdatePriceTier(
                              actualIdx,
                              "minQuantity",
                              Number(e.target.value),
                            )
                          }
                          placeholder='5'
                        />
                        <div className='relative'>
                          <Input
                            type='number'
                            min={0}
                            value={tier.unitPrice}
                            onChange={(e) =>
                              handleUpdatePriceTier(
                                actualIdx,
                                "unitPrice",
                                Number(e.target.value),
                              )
                            }
                            placeholder='35000'
                          />
                          {discountRate > 0 && (
                            <span className='absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium pointer-events-none'>
                              -{discountRate}%
                            </span>
                          )}
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='text-red-500 h-9 w-9 p-0'
                          onClick={() => handleRemovePriceTier(actualIdx)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    );
                  })}
                <p className='text-xs text-gray-400 mt-1'>
                  주문 수량이 최소 수량 이상일 때 해당 구간의 개당 가격이
                  적용됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Spinner />}
            {editingProduct ? "수정" : "생성"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
