"use client";

import React, { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  Type,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";
import type {
  ProductImage,
  ProductWithAreas,
  CustomizableArea,
} from "@/domain/product/types";
import {
  useDesignStore,
  useCurrentColorLayers,
} from "@/lib/store/design-store";
import {
  useStudioConfig,
  HatView,
  ProductColor,
} from "@/lib/store/studio-context";
import {
  HatDesignCanvas,
  getDefaultLayerPosition,
  measureTextLayerSize,
} from "@/components/shared/HatDesignCanvas";
import { toast } from "sonner";
import { useCartStore } from "@/lib/store/cart-store";
import { TextAddModal } from "@/components/studio/TextAddModal";
import { TextEditToolbar } from "@/components/studio/TextEditToolbar";

interface OrderStyleStudioLayoutProps {
  productId?: string;
  productName?: string;
  product?: ProductWithAreas;
}

const VIEWS: { id: HatView; label: string }[] = [
  { id: "front", label: "정면" },
  { id: "back", label: "후면" },
  { id: "left", label: "좌측" },
  { id: "right", label: "우측" },
  { id: "top", label: "상단" },
];

export function OrderStyleStudioLayout({
  product,
  productName,
}: OrderStyleStudioLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { config } = useStudioConfig();
  const cartItemId = searchParams.get("cartItemId");
  const updateItemDesign = useCartStore((state) => state.updateItemDesign);
  const [isSaving, setIsSaving] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);

  const selectedColor = useDesignStore((state) => state.selectedColor);
  const currentView = useDesignStore((state) => state.currentView);
  const setCurrentView = useDesignStore((state) => state.setCurrentView);
  const addLayer = useDesignStore((state) => state.addLayer);
  const updateLayer = useDesignStore((state) => state.updateLayer);
  const removeLayer = useDesignStore((state) => state.removeLayer);
  const rotateLayer = useDesignStore((state) => state.rotateLayer);
  const selectedLayerId = useDesignStore((state) => state.selectedLayerId);
  const selectLayer = useDesignStore((state) => state.selectLayer);

  const currentColorLayers = useCurrentColorLayers();
  const selectedLayer = currentColorLayers.find(
    (l) => l.id === selectedLayerId,
  );
  const selectedTextLayer =
    selectedLayer && selectedLayer.type === "text" ? selectedLayer : null;
  const viewLayers = currentColorLayers.filter((l) => l.view === currentView);

  const productColors: ProductColor[] = useMemo(() => {
    if (!product?.variants || !product?.images) {
      return config.colors;
    }

    return product.variants.map((variant) => {
      const views: Record<HatView, string> = {
        front: "",
        back: "",
        left: "",
        right: "",
        top: "",
      };

      product.images.forEach((img: ProductImage) => {
        if (
          img.colorId === variant.id &&
          views[img.view as HatView] !== undefined
        ) {
          views[img.view as HatView] = img.url;
        }
      });

      return {
        id: variant.id,
        label: variant.label,
        hex: variant.hex,
        views,
      };
    });
  }, [product, config.colors]);

  const productSafeZones = useMemo(() => {
    if (!product?.customizableAreas || product.customizableAreas.length === 0) {
      return config.safeZones;
    }

    const zones: Partial<
      Record<HatView, { x: number; y: number; width: number; height: number }>
    > = {};

    product.customizableAreas.forEach((area: CustomizableArea) => {
      if (area.isEnabled && !area.colorId) {
        zones[area.viewName as HatView] = {
          x: area.zoneX,
          y: area.zoneY,
          width: area.zoneWidth,
          height: area.zoneHeight,
        };
      }
    });

    product.customizableAreas.forEach((area: CustomizableArea) => {
      if (area.isEnabled && area.colorId === selectedColor) {
        zones[area.viewName as HatView] = {
          x: area.zoneX,
          y: area.zoneY,
          width: area.zoneWidth,
          height: area.zoneHeight,
        };
      }
    });

    return zones;
  }, [product, config.safeZones, selectedColor]);

  const selectedColorLabel = useMemo(
    () =>
      productColors.find((c) => c.id === selectedColor)?.label || selectedColor,
    [productColors, selectedColor],
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const defaultPos = getDefaultLayerPosition(currentView, {
        ...config,
        colors: productColors,
        safeZones: productSafeZones as Record<
          HatView,
          { x: number; y: number; width: number; height: number }
        >,
      });

      addLayer({
        type: "image",
        content,
        ...defaultPos,
        view: currentView,
        rotation: 0,
        flipX: false,
        flipY: false,
      });
      toast.success("이미지 레이어가 추가되었습니다.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleFlip = (axis: "x" | "y") => {
    if (!selectedLayerId || !selectedLayer) return;
    updateLayer(selectedLayerId, {
      [axis === "x" ? "flipX" : "flipY"]:
        axis === "x" ? !selectedLayer.flipX : !selectedLayer.flipY,
    });
  };

  const handleAddText = (data: {
    text: string;
    color: string;
    fontSize: number;
    fontFamily: string;
  }) => {
    const textSize = measureTextLayerSize(
      data.text,
      data.fontSize,
      data.fontFamily,
    );
    const defaultPos = getDefaultLayerPosition(
      currentView,
      {
        ...config,
        safeZones: productSafeZones,
      },
      textSize,
    );

    addLayer({
      type: "text",
      content: data.text,
      ...defaultPos,
      view: currentView,
      rotation: 0,
      flipX: false,
      flipY: false,
      color: data.color,
      fontSize: data.fontSize,
      fontFamily: data.fontFamily,
    });
    toast.success("텍스트 레이어가 추가되었습니다.");
  };

  const handleSaveDesign = async () => {
    if (!cartItemId) {
      toast.error("저장 대상 장바구니 항목을 찾을 수 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
      updateItemDesign(cartItemId, currentColorLayers);
      toast.success("수정한 디자인이 장바구니에 저장되었습니다.");
      router.push("/cart");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='bg-white border-b sticky top-0 z-40'>
        <div className='container mx-auto px-4 py-3'>
          <div className='flex items-center gap-4'>
            <Button variant='ghost' size='sm' onClick={() => router.back()}>
              <ArrowLeft className='w-4 h-4 mr-1' />
              돌아가기
            </Button>
            <div>
              <h1 className='font-bold text-lg'>디자인 수정</h1>
              <p className='text-sm text-gray-500'>
                {product?.name || productName} · {selectedColorLabel}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className='flex h-[calc(100vh-64px)]'>
        <div className='w-80 bg-white border-r overflow-y-auto'>
          <div className='p-4 space-y-3'>
            <p className='text-xs text-gray-500'>커스텀 내역 확인</p>
            <div className='rounded-xl border-2 border-blue-500 shadow-sm overflow-hidden'>
              <div className='p-3 bg-blue-50'>
                <p className='font-bold text-sm truncate'>
                  {product?.name || productName}
                </p>
                <p className='text-xs text-gray-600 mt-0.5'>
                  {selectedColorLabel}
                </p>
                <p className='text-xs text-blue-700 mt-1'>
                  {currentColorLayers.length}개 레이어
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className='flex-1 flex flex-col'>
          <div className='bg-white border-b px-4 py-2'>
            <Tabs
              value={currentView}
              onValueChange={(v) => setCurrentView(v as HatView)}
            >
              <TabsList>
                {VIEWS.map((view) => {
                  const hasDesignInView = currentColorLayers.some(
                    (l) => l.view === view.id,
                  );
                  return (
                    <TabsTrigger
                      key={view.id}
                      value={view.id}
                      className='relative'
                    >
                      {view.label}
                      {hasDesignInView && (
                        <span className='absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full' />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          <div className='flex-1 flex items-center justify-center p-8 bg-gray-100 relative'>
            {selectedTextLayer && (
              <TextEditToolbar
                fontFamily={selectedTextLayer.fontFamily || "'Noto Sans KR'"}
                color={selectedTextLayer.color || "#000000"}
                fontSize={selectedTextLayer.fontSize || 24}
                onFontFamilyChange={(fontFamily) =>
                  updateLayer(selectedTextLayer.id, { fontFamily })
                }
                onColorChange={(color) =>
                  updateLayer(selectedTextLayer.id, { color })
                }
                onFontSizeChange={(fontSize) =>
                  updateLayer(selectedTextLayer.id, { fontSize })
                }
              />
            )}
            <div className='w-full max-w-[600px]'>
              <HatDesignCanvas
                hatColor={selectedColor}
                currentView={currentView}
                layers={currentColorLayers}
                editable={true}
                onLayerUpdate={updateLayer}
                onLayerRemove={removeLayer}
                onLayerSelect={selectLayer}
                selectedLayerId={selectedLayerId}
                showSafeZone={true}
                className='w-full rounded-xl shadow-lg bg-white'
                productColors={productColors}
                productSafeZones={productSafeZones}
              />
            </div>
          </div>
        </div>

        <div className='w-72 bg-white border-l overflow-y-auto'>
          <div className='p-4 space-y-4'>
            <Button
              onClick={handleSaveDesign}
              disabled={isSaving}
              className='w-full'
            >
              {isSaving ? (
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
              ) : (
                <Save className='w-4 h-4 mr-2' />
              )}
              {isSaving ? "저장 중..." : "저장"}
            </Button>

            <label className='block'>
              <input
                type='file'
                accept='image/*'
                onChange={handleImageUpload}
                className='hidden'
              />
              <Button variant='outline' className='w-full' asChild>
                <span>
                  <Upload className='w-4 h-4 mr-2' />
                  이미지 추가
                </span>
              </Button>
            </label>
            <Button
              variant='outline'
              className='w-full'
              onClick={() => setIsTextModalOpen(true)}
            >
              <Type className='w-4 h-4 mr-2' />
              텍스트 추가
            </Button>

            {selectedLayerId && selectedLayer && (
              <>
                <Separator />
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => rotateLayer(selectedLayerId, -45)}
                  >
                    <RotateCcw className='w-4 h-4 mr-1' />
                    -45°
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => rotateLayer(selectedLayerId, 45)}
                  >
                    <RotateCw className='w-4 h-4 mr-1' />
                    +45°
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFlip("x")}
                  >
                    <FlipHorizontal className='w-4 h-4 mr-1' />
                    좌우
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleFlip("y")}
                  >
                    <FlipVertical className='w-4 h-4 mr-1' />
                    상하
                  </Button>
                </div>
                <Button
                  variant='destructive'
                  size='sm'
                  className='w-full'
                  onClick={() => removeLayer(selectedLayerId)}
                >
                  <Trash2 className='w-4 h-4 mr-1' />
                  삭제
                </Button>
              </>
            )}

            <Separator />
            <div>
              <h4 className='font-medium text-sm mb-2'>
                레이어 ({viewLayers.length})
              </h4>
              {viewLayers.length === 0 ? (
                <p className='text-sm text-gray-400 text-center py-4'>
                  이 뷰에 디자인이 없습니다
                </p>
              ) : (
                <div className='space-y-2'>
                  {viewLayers.map((layer, index) => (
                    <div
                      key={layer.id}
                      className={`w-full p-2 rounded border text-sm ${
                        selectedLayerId === layer.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <button
                        onClick={() => selectLayer(layer.id)}
                        className='w-full text-left'
                      >
                        <div className='flex items-center gap-2'>
                          {layer.type === "image" ? (
                            <ImageIcon className='w-4 h-4 text-gray-400 shrink-0' />
                          ) : (
                            <Type className='w-4 h-4 text-gray-400 shrink-0' />
                          )}
                          <span className='truncate flex-1'>
                            {layer.type === "image"
                              ? `이미지 ${index + 1}`
                              : layer.content || `텍스트 ${index + 1}`}
                          </span>
                          <span className='text-[11px] text-gray-500'>
                            {layer.view}
                          </span>
                        </div>
                      </button>
                      <div className='mt-2 flex justify-end'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50'
                          onClick={() => removeLayer(layer.id)}
                        >
                          <Trash2 className='w-3.5 h-3.5 mr-1' />
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <TextAddModal
        open={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onConfirm={handleAddText}
      />
    </div>
  );
}
