"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { X, RotateCw } from "lucide-react";
import {
  useStudioConfig,
  HatView,
  ProductColor,
  Zone,
} from "@/lib/store/studio-context";

/**
 * 통합 좌표 시스템
 *
 * 모든 좌표는 캔버스 영역 대비 0-100% 퍼센트로 저장됩니다.
 * 예: x=50, y=50 → 캔버스 중앙
 * 예: width=20, height=20 → 캔버스의 20% 크기
 *
 * 이 컴포넌트는 스튜디오, 주문 상세, 미리보기 등 모든 곳에서
 * 동일한 렌더링 결과를 보장합니다.
 */

export interface DesignLayer {
  id: string;
  type: "image" | "text";
  content: string;
  x: number; // 0-100% (캔버스 좌측 기준)
  y: number; // 0-100% (캔버스 상단 기준)
  width: number; // 0-100% (캔버스 너비 대비)
  height: number; // 0-100% (캔버스 높이 대비)
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  view: HatView;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
}

interface HatDesignCanvasProps {
  // 필수 props
  hatColor: string;
  currentView: HatView;
  layers: DesignLayer[];

  // 편집 모드 (false면 읽기 전용)
  editable?: boolean;

  // 레이어 조작 콜백 (editable=true일 때만 필요)
  onLayerUpdate?: (layerId: string, updates: Partial<DesignLayer>) => void;
  onLayerRemove?: (layerId: string) => void;
  onLayerSelect?: (layerId: string | null) => void;
  onLayerRotate?: (layerId: string, degrees: number) => void;
  selectedLayerId?: string | null;

  // 스타일링
  className?: string;
  showSafeZone?: boolean;
  showViewLabel?: boolean;

  // 상품별 색상/이미지 (제공되면 기본 config 대신 사용)
  productColors?: ProductColor[];
  // 상품별 인쇄 영역 (제공되면 기본 safeZones 대신 사용, 비활성화된 뷰는 미포함)
  productSafeZones?: Partial<Record<HatView, Zone>>;
}

/**
 * 회전 핸들 컴포넌트
 * PPT처럼 드래그로 자유 회전 가능
 */
function RotationHandle({
  layerId,
  rotation,
  pixelWidth,
  pixelHeight,
  onRotationChange,
}: {
  layerId: string;
  rotation: number;
  pixelWidth: number;
  pixelHeight: number;
  onRotationChange: (layerId: string, newRotation: number) => void;
}) {
  const isDragging = useRef(false);
  const centerRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging.current = true;

      // 레이어 중심 좌표 계산
      const handle = e.currentTarget as HTMLElement;
      const rndEl = handle.closest('[class*="z-10"]') as HTMLElement;
      if (!rndEl) return;

      const rect = rndEl.getBoundingClientRect();
      centerRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      const handleMouseMove = (moveE: MouseEvent) => {
        if (!isDragging.current) return;

        const angle = Math.atan2(
          moveE.clientY - centerRef.current.y,
          moveE.clientX - centerRef.current.x,
        );
        // atan2는 오른쪽이 0도, 위가 -90도이므로 90도를 더해 상단이 0도가 되도록 조정
        let degrees = (angle * 180) / Math.PI + 90;
        if (degrees < 0) degrees += 360;

        // shift 키를 누르면 15도 단위로 스냅
        if (moveE.shiftKey) {
          degrees = Math.round(degrees / 15) * 15;
        }

        onRotationChange(layerId, Math.round(degrees));
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [layerId, onRotationChange],
  );

  return (
    <>
      {/* 회전 핸들 연결선 */}
      <div
        className='absolute left-1/2 -translate-x-1/2 w-px bg-blue-500 pointer-events-none'
        style={{ top: -24, height: 24 }}
      />
      {/* 회전 핸들 원형 */}
      <div
        className='absolute left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing'
        style={{ top: -36 }}
        onMouseDown={handleMouseDown}
      >
        <div className='w-5 h-5 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center shadow-md transition-colors'>
          <RotateCw size={10} className='text-white' />
        </div>
      </div>
    </>
  );
}

/**
 * 통합 모자 디자인 캔버스
 *
 * 모든 화면에서 동일한 좌표 시스템과 렌더링 로직을 사용합니다.
 */
export function HatDesignCanvas({
  hatColor,
  currentView,
  layers,
  editable = false,
  onLayerUpdate,
  onLayerRemove,
  onLayerSelect,
  onLayerRotate,
  selectedLayerId,
  className = "",
  showSafeZone = true,
  showViewLabel = false,
  productColors,
  productSafeZones,
}: HatDesignCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState(400);

  const { config } = useStudioConfig();

  // 상품별 색상이 제공되면 사용, 아니면 기본 config 사용
  const colors = productColors || config.colors;

  // 상품별 인쇄 영역이 제공되면 사용, 아니면 기본 safeZones 사용
  const safeZones = productSafeZones || config.safeZones;

  // 현재 색상과 뷰에 맞는 모자 이미지
  const hatImage =
    colors.find((c) => c.id === hatColor)?.views[currentView] || "";

  // 현재 뷰의 안전 영역
  const zone = safeZones[currentView];

  // 현재 뷰의 레이어만 필터링
  const viewLayers = layers.filter((l) => l.view === currentView);

  // 캔버스 크기 감지
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      // 정사각형 캔버스이므로 너비 = 높이
      setCanvasSize(Math.min(rect.width, rect.height));
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas);
    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  // 퍼센트 → 픽셀 변환
  const toPixel = useCallback(
    (percent: number) => (percent / 100) * canvasSize,
    [canvasSize],
  );

  // 픽셀 → 퍼센트 변환
  const toPercent = useCallback(
    (pixel: number) => (pixel / canvasSize) * 100,
    [canvasSize],
  );

  // 레이어 드래그 완료
  const handleDragStop = (layerId: string, x: number, y: number) => {
    if (!editable || !onLayerUpdate) return;
    onLayerUpdate(layerId, {
      x: toPercent(x),
      y: toPercent(y),
    });
  };

  // 레이어 리사이즈 완료
  const handleResizeStop = (
    layerId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    if (!editable || !onLayerUpdate) return;
    onLayerUpdate(layerId, {
      x: toPercent(x),
      y: toPercent(y),
      width: toPercent(width),
      height: toPercent(height),
    });
  };

  // 레이어 선택
  const handleLayerClick = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editable && onLayerSelect) {
      onLayerSelect(layerId);
    }
  };

  // 캔버스 클릭 (레이어 선택 해제)
  const handleCanvasClick = () => {
    if (editable && onLayerSelect) {
      onLayerSelect(null);
    }
  };

  return (
    <div
      ref={canvasRef}
      className={`relative aspect-square bg-gray-50 overflow-hidden ${className}`}
      onClick={handleCanvasClick}
    >
      {/* 모자 이미지 - 캔버스 전체를 채움 */}
      {hatImage && (
        <img
          src={hatImage}
          alt={`${hatColor} hat ${currentView}`}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none
            ${currentView === "right" && hatColor !== "black" ? "scale-x-[-1]" : ""}
          `}
          draggable={false}
        />
      )}

      {/* 안전 영역 표시 */}
      {showSafeZone && zone && (
        <div
          className='absolute border-2 border-dashed border-blue-400/50 bg-blue-400/5 pointer-events-none z-[5]'
          style={{
            left: `${zone.x}%`,
            top: `${zone.y}%`,
            width: `${zone.width}%`,
            height: `${zone.height}%`,
          }}
        >
          <div className='absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1 rounded-bl'>
            PRINT AREA
          </div>
        </div>
      )}

      {/* 뷰 라벨 */}
      {showViewLabel && (
        <div className='absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none'>
          {currentView.toUpperCase()}
        </div>
      )}

      {/* 디자인 레이어들 */}
      {viewLayers.map((layer) => {
        const isSelected = selectedLayerId === layer.id;
        const pixelX = toPixel(layer.x);
        const pixelY = toPixel(layer.y);
        const pixelWidth = toPixel(layer.width);
        const pixelHeight = toPixel(layer.height);

        const flipStyle = `scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`;
        const fullTransformStyle = `rotate(${layer.rotation}deg) ${flipStyle}`;

        // 읽기 전용 모드
        if (!editable) {
          return (
            <div
              key={layer.id}
              className='absolute pointer-events-none'
              style={{
                left: pixelX,
                top: pixelY,
                width: pixelWidth,
                height: pixelHeight,
              }}
            >
              <div
                className='w-full h-full'
                style={{ transform: fullTransformStyle }}
              >
                {layer.type === "image" ? (
                  <img
                    src={layer.content}
                    alt='Design'
                    className='w-full h-full object-contain'
                    draggable={false}
                  />
                ) : (
                  <div
                    className='w-full h-full flex items-center justify-center text-center font-bold whitespace-nowrap'
                    style={{
                      color: layer.color || "#000",
                      fontSize: `${((layer.fontSize || 24) / 400) * canvasSize}px`,
                      fontFamily: layer.fontFamily || undefined,
                    }}
                  >
                    {layer.content}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // 드래그 회전 핸들러
        const handleRotationChange = (layerId: string, newRotation: number) => {
          if (onLayerUpdate) {
            onLayerUpdate(layerId, { rotation: newRotation });
          }
        };

        // 편집 가능 모드 - Rnd 사용 + 외부 div에 rotation 적용
        return (
          <div
            key={layer.id}
            className='absolute z-10'
            style={{
              left: pixelX,
              top: pixelY,
              width: pixelWidth,
              height: pixelHeight,
              transform: `rotate(${layer.rotation}deg)`,
              transformOrigin: "center center",
            }}
          >
            <Rnd
              position={{ x: 0, y: 0 }}
              size={{ width: pixelWidth, height: pixelHeight }}
              lockAspectRatio
              enableResizing={isSelected}
              disableDragging={false}
              className={`${isSelected ? "ring-2 ring-blue-500" : "hover:ring-2 hover:ring-blue-300"}`}
              onDragStart={(e) => {
                e.stopPropagation();
                onLayerSelect?.(layer.id);
              }}
              onDragStop={(e, d) => {
                const rad = (layer.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rotatedDx = d.x * cos - d.y * sin;
                const rotatedDy = d.x * sin + d.y * cos;
                handleDragStop(
                  layer.id,
                  pixelX + rotatedDx,
                  pixelY + rotatedDy,
                );
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const newWidth = parseFloat(ref.style.width);
                const newHeight = parseFloat(ref.style.height);
                const rad = (layer.rotation * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);
                const rotatedX = position.x * cos - position.y * sin;
                const rotatedY = position.x * sin + position.y * cos;

                const updates: Partial<DesignLayer> = {
                  x: toPercent(pixelX + rotatedX),
                  y: toPercent(pixelY + rotatedY),
                  width: toPercent(newWidth),
                  height: toPercent(newHeight),
                };

                if (layer.type === "text" && pixelWidth > 0) {
                  const scale = newWidth / pixelWidth;
                  updates.fontSize = Math.round(
                    Math.max(8, Math.min(120, (layer.fontSize || 24) * scale)),
                  );
                }

                onLayerUpdate?.(layer.id, updates);
              }}
              onClick={(e: React.MouseEvent) => handleLayerClick(layer.id, e)}
            >
              <div className='relative w-full h-full group'>
                <div className='w-full h-full' style={{ transform: flipStyle }}>
                  {layer.type === "image" ? (
                    <img
                      src={layer.content}
                      alt='Design'
                      className='w-full h-full object-contain pointer-events-none'
                      draggable={false}
                    />
                  ) : (
                    <div
                      className='w-full h-full flex items-center justify-center text-center font-bold whitespace-nowrap'
                      style={{
                        color: layer.color || "#000",
                        fontSize: `${((layer.fontSize || 24) / 400) * canvasSize}px`,
                        fontFamily: layer.fontFamily || undefined,
                      }}
                    >
                      {layer.content}
                    </div>
                  )}
                </div>

                {/* 회전 드래그 핸들 - 선택 시 항상 표시 */}
                {isSelected && onLayerUpdate && (
                  <RotationHandle
                    layerId={layer.id}
                    rotation={layer.rotation}
                    pixelWidth={pixelWidth}
                    pixelHeight={pixelHeight}
                    onRotationChange={handleRotationChange}
                  />
                )}

                {/* 컨트롤 버튼들 */}
                {isSelected && (
                  <div className='absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                    {/* 45° 회전 버튼 */}
                    {onLayerRotate && (
                      <button
                        className='bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerRotate(layer.id, 45);
                        }}
                        title='45° 회전'
                      >
                        <RotateCw size={12} />
                      </button>
                    )}
                    {/* 삭제 버튼 */}
                    {onLayerRemove && (
                      <button
                        className='bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerRemove(layer.id);
                        }}
                        title='삭제'
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Rnd>
          </div>
        );
      })}
    </div>
  );
}

/**
 * 캔버스 기준 400px에서의 텍스트 크기를 측정하여 퍼센트로 반환
 */
export function measureTextLayerSize(
  text: string,
  fontSize: number,
  fontFamily: string,
): { width: number; height: number } {
  const REFERENCE_SIZE = 400;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return { width: 15, height: 8 };

  const scaledFontSize = (fontSize / 400) * REFERENCE_SIZE;
  ctx.font = `bold ${scaledFontSize}px ${fontFamily.replace(/'/g, "")}`;
  const metrics = ctx.measureText(text);

  const padding = scaledFontSize * 0.3;
  const pxWidth = metrics.width + padding;
  const pxHeight = scaledFontSize * 1.3 + padding;

  const widthPercent = Math.max(
    5,
    Math.min(80, (pxWidth / REFERENCE_SIZE) * 100),
  );
  const heightPercent = Math.max(
    4,
    Math.min(40, (pxHeight / REFERENCE_SIZE) * 100),
  );

  return { width: widthPercent, height: heightPercent };
}

/**
 * 새 레이어 생성 시 기본 좌표 (안전 영역 중앙)
 */
export function getDefaultLayerPosition(
  view: HatView,
  config: {
    safeZones: Partial<
      Record<HatView, { x: number; y: number; width: number; height: number }>
    >;
  },
  layerSize?: { width: number; height: number },
) {
  const zone = config.safeZones[view] || {
    x: 30,
    y: 30,
    width: 40,
    height: 30,
  };

  const w = layerSize?.width ?? 15;
  const h = layerSize?.height ?? 15;
  const centerX = zone.x + zone.width / 2 - w / 2;
  const centerY = zone.y + zone.height / 2 - h / 2;

  return {
    x: centerX,
    y: centerY,
    width: w,
    height: h,
  };
}
