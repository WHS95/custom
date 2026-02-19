"use client";

import React, { useMemo, useEffect } from "react";
import { HatCanvas } from "./HatCanvas";
import { ProductSidebar } from "./ProductSidebar";
import { DesignToolbar } from "./DesignToolbar";
import { toast } from "sonner";
import {
  useDesignStore,
  useCurrentColorLayers,
} from "@/lib/store/design-store";
import {
  useStudioConfig,
  ProductColor,
  HatView,
} from "@/lib/store/studio-context";
import { getDefaultLayerPosition } from "@/components/shared/HatDesignCanvas";
import { useAlertModal } from "@/components/ui/alert-modal";
import type {
  ProductImage,
  ProductWithAreas,
  CustomizableArea,
} from "@/domain/product/types";

interface StudioLayoutProps {
  productId?: string;
  productName?: string;
  product?: ProductWithAreas; // 상품 정보 (이미지 + 커스터마이즈 영역 포함)
}

/**
 * StudioLayout 컴포넌트
 * 모자 커스터마이징 스튜디오의 메인 레이아웃
 * Zustand 스토어를 사용하여 상태를 관리하고 로컬 스토리지에 자동 저장
 *
 * 핵심 기능:
 * - 색상별 독립적인 디자인 저장
 * - 뷰(앞/뒤/좌/우/위)별 레이어 관리
 * - 로컬 스토리지 영속성
 */
export function StudioLayout({
  productId,
  productName,
  product,
}: StudioLayoutProps) {
  // Zustand 스토어에서 상태와 액션 가져오기
  const selectedColor = useDesignStore((state) => state.selectedColor);
  const currentView = useDesignStore((state) => state.currentView);
  const setSelectedColor = useDesignStore((state) => state.setSelectedColor);
  const setCurrentView = useDesignStore((state) => state.setCurrentView);
  const addLayer = useDesignStore((state) => state.addLayer);
  const updateLayer = useDesignStore((state) => state.updateLayer);
  const removeLayer = useDesignStore((state) => state.removeLayer);
  const rotateLayer = useDesignStore((state) => state.rotateLayer);

  // 스튜디오 설정 (안전 영역 등)
  const { config } = useStudioConfig();

  // 에러 알림 모달
  const { showAlert, AlertModal } = useAlertModal();

  // 상품의 색상 정보를 studio-context 형식으로 변환
  const productColors: ProductColor[] = useMemo(() => {
    if (!product?.variants || !product?.images) {
      return config.colors; // 기본 색상 사용
    }

    return product.variants.map((variant) => {
      // 해당 색상의 모든 뷰 이미지 찾기
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

  // 상품 색상이 로드되면, 현재 selectedColor가 유효한지 확인하고
  // 유효하지 않으면 첫 번째 색상으로 자동 설정
  useEffect(() => {
    if (productColors.length > 0) {
      const isCurrentColorValid = productColors.some(
        (c) => c.id === selectedColor,
      );
      if (!isCurrentColorValid) {
        setSelectedColor(productColors[0].id);
      }
    }
  }, [productColors, selectedColor, setSelectedColor]);

  // 현재 색상의 모든 레이어 가져오기
  const currentColorLayers = useCurrentColorLayers();

  // 상품의 커스터마이즈 영역을 safeZones 형식으로 변환
  // 비활성화된 영역은 제외하여 PRINT AREA가 표시되지 않도록 함
  // 색상별 영역이 있으면 우선 사용, 없으면 공통(colorId=null) 영역 사용
  const productSafeZones = useMemo(() => {
    if (!product?.customizableAreas || product.customizableAreas.length === 0) {
      return config.safeZones; // 기본 safeZones 사용
    }

    // 빈 객체에서 시작 - 활성화된 영역만 추가
    const zones: Partial<
      Record<HatView, { x: number; y: number; width: number; height: number }>
    > = {};

    // 먼저 공통 영역(colorId가 null/undefined)을 추가
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

    // 그 다음 현재 선택된 색상의 영역으로 덮어씀 (우선순위 높음)
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

  // 활성화된 뷰 목록 계산 (뷰 스위처에서 비활성화된 뷰 숨기기용)
  // 현재 색상의 활성화된 영역 + 공통 영역 기준으로 계산
  const enabledViews = useMemo(() => {
    if (!product?.customizableAreas || product.customizableAreas.length === 0) {
      return ["front", "back", "left", "right", "top"] as HatView[];
    }

    const enabledViewSet = new Set<HatView>();

    // 공통 영역(colorId가 null/undefined)에서 활성화된 뷰 추가
    product.customizableAreas
      .filter((area: CustomizableArea) => area.isEnabled && !area.colorId)
      .forEach((area: CustomizableArea) =>
        enabledViewSet.add(area.viewName as HatView),
      );

    // 현재 색상의 활성화된 뷰 추가
    product.customizableAreas
      .filter(
        (area: CustomizableArea) =>
          area.isEnabled && area.colorId === selectedColor,
      )
      .forEach((area: CustomizableArea) =>
        enabledViewSet.add(area.viewName as HatView),
      );

    // Set이 비어있으면 모든 뷰 활성화
    if (enabledViewSet.size === 0) {
      return ["front", "back", "left", "right", "top"] as HatView[];
    }

    return Array.from(enabledViewSet);
  }, [product, selectedColor]);

  // 상품 기반 설정 오버라이드
  const effectiveConfig = useMemo(() => {
    if (!product) return config;
    return {
      ...config,
      basePrice: product.basePrice,
      colors: productColors,
      safeZones: productSafeZones,
    };
  }, [config, product, productColors, productSafeZones]);

  // 카카오톡 문의 링크
  const KAKAO_LINK = "https://open.kakao.com/me/runhouse";

  /**
   * 파일 업로드 핸들러
   * PNG 파일만 허용, 2500px 이상 크기 검증 후 레이어로 추가
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // PNG 파일 타입 검증
    if (file.type !== "image/png") {
      showAlert({
        type: "error",
        title: "PNG 파일만 업로드 가능합니다",
        description:
          "JPG, GIF 등 다른 형식의 파일은 지원되지 않습니다.\n고화질 이미지 준비가 어려우시면 문의해주세요.",
        kakaoLink: KAKAO_LINK,
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;

      // 이미지 크기 검증을 위해 Image 객체 생성
      const img = new window.Image();
      img.onload = () => {
        // 최소 2500px 이상인지 확인 (가로 또는 세로)
        if (img.width < 100 && img.height < 100) {
          showAlert({
            type: "error",
            title: "이미지 크기가 너무 작습니다",
            description: `현재 크기: ${img.width}×${img.height}px\n최소 2500px 이상의 고화질 이미지가 필요합니다.\n고화질 이미지 준비가 어려우시면 문의해주세요.`,
            kakaoLink: KAKAO_LINK,
          });
          return;
        }

        // 공통 함수를 사용하여 기본 위치 계산
        const defaultPos = getDefaultLayerPosition(
          currentView,
          effectiveConfig,
        );

        addLayer({
          type: "image",
          content: dataUrl,
          ...defaultPos,
          view: currentView,
          rotation: 0,
          flipX: false,
          flipY: false,
        });

        toast.success("이미지 레이어가 추가되었습니다");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
    e.target.value = "";
  };

  /**
   * 레이어 삭제 핸들러
   */
  const handleRemoveLayer = (id: string) => {
    removeLayer(id);
    toast.info("레이어가 삭제되었습니다");
  };

  /**
   * 레이어 업데이트 핸들러
   * 위치, 크기, 회전, 반전 등의 변경 처리
   */
  const handleUpdateLayer = (
    id: string,
    updates: Partial<(typeof currentColorLayers)[0]>,
  ) => {
    updateLayer(id, updates);
  };

  /**
   * 레이어 회전 핸들러
   */
  const handleRotateLayer = (id: string, degrees: number) => {
    rotateLayer(id, degrees);
  };

  return (
    <div className='flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50'>
      {/* 에러 알림 모달 */}
      <AlertModal />

      {/* Main Canvas Area */}
      <div className='flex-1 relative'>
        <HatCanvas
          hatColor={selectedColor}
          currentView={currentView}
          onViewChange={setCurrentView}
          layers={currentColorLayers}
          onRemoveLayer={handleRemoveLayer}
          onUpdateLayer={handleUpdateLayer}
          onRotateLayer={handleRotateLayer}
          productColors={product ? productColors : undefined}
          productSafeZones={product ? productSafeZones : undefined}
          enabledViews={product ? enabledViews : undefined}
        />

        {/* Floating Tool Bar */}
        <DesignToolbar
          onUploadClick={() =>
            document.getElementById("hidden-file-input")?.click()
          }
        />

        {/* Hidden Input for Toolbar Action - PNG 파일만 허용 */}
        <input
          id='hidden-file-input'
          type='file'
          accept='.png,image/png'
          onChange={handleFileUpload}
          className='hidden'
        />
      </div>

      {/* Right Sidebar: Product & Commerce */}
      <ProductSidebar
        productId={productId}
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        productColors={product ? productColors : undefined}
        productBasePrice={product?.basePrice}
        productName={product?.name || productName}
        productSizes={product?.variants?.[0]?.sizes}
        priceTiers={product?.priceTiers}
      />
    </div>
  );
}
