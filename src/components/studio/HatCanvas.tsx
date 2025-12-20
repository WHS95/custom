import React, { useRef, useState, useEffect, useCallback } from "react"
import { Rnd } from "react-rnd"
import { X, RotateCcw, RotateCw, Trash2, FlipHorizontal, FlipVertical, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStudioConfig, HatView } from "@/lib/store/studio-context"
import { DesignLayer } from "@/lib/store/design-store"

/**
 * 캔버스 스케일링 상수
 * 기준 크기(BASE_SIZE)를 기반으로 화면 크기 변화에 따른 스케일을 계산합니다.
 * 최소 스케일(MIN_SCALE)을 설정하여 너무 작아지지 않도록 제한합니다.
 */
export const BASE_SIZE = 800  // 기준 캔버스 크기 (px)
export const MIN_SCALE = 0.5  // 최소 스케일 비율 (50% 이하로 줄어들지 않음)

// Layer 타입을 DesignLayer로 재정의 (하위 호환성 유지)
export type Layer = DesignLayer

/**
 * HatCanvasProps 인터페이스
 * HatCanvas 컴포넌트에 전달되는 props의 타입을 정의합니다.
 */
interface HatCanvasProps {
  hatColor: string                        // 현재 선택된 모자 색상 ID
  currentView: HatView                    // 현재 보고 있는 모자 뷰 (앞, 뒤, 좌, 우, 위)
  onViewChange: (view: HatView) => void   // 뷰 변경 시 호출될 콜백 함수
  layers: DesignLayer[]                   // 전체 레이어 목록
  onRemoveLayer: (id: string) => void     // 레이어 삭제 시 호출될 콜백 함수
  onUpdateLayer?: (id: string, updates: Partial<DesignLayer>) => void  // 레이어 업데이트 콜백 (위치, 크기 변경 시)
}

/**
 * HatCanvas 컴포넌트
 * 모자 디자인 스튜디오의 메인 캔버스 영역을 담당합니다.
 * 사용자는 여기서 모자의 뷰를 변경하고, 디자인 레이어를 확인 및 조작할 수 있습니다.
 */
export function HatCanvas({ hatColor, currentView, onViewChange, layers, onRemoveLayer, onUpdateLayer }: HatCanvasProps) {
  // 외부 캔버스 컨테이너 참조 (전체 영역)
  const containerRef = useRef<HTMLDivElement>(null)
  // 모자 이미지 영역 참조 (레이어가 배치되는 실제 영역)
  const hatAreaRef = useRef<HTMLDivElement>(null)
  
  // 모자 이미지 영역 크기 상태 (레이어 스케일 계산에 사용)
  const [hatAreaSize, setHatAreaSize] = useState({ width: BASE_SIZE, height: BASE_SIZE })
  
  // 스케일 계산: 모자 이미지 영역 크기 / 기준 크기, 최소 스케일 적용
  // 이렇게 하면 화면이 작아져도 MIN_SCALE 이하로 줄어들지 않습니다.
  const scale = Math.max(
    Math.min(hatAreaSize.width, hatAreaSize.height) / BASE_SIZE,
    MIN_SCALE
  )
  
  // ResizeObserver를 사용하여 모자 이미지 영역 크기 변화를 감지합니다.
  useEffect(() => {
    const hatArea = hatAreaRef.current
    if (!hatArea) return

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        const { width, height } = entry.contentRect
        setHatAreaSize({ width, height })
      }
    })

    resizeObserver.observe(hatArea)
    
    // 초기 크기 설정
    setHatAreaSize({
      width: hatArea.offsetWidth,
      height: hatArea.offsetHeight
    })

    return () => resizeObserver.disconnect()
  }, [])
  
  // 전역 스튜디오 설정(config)을 가져옵니다.
  const { config } = useStudioConfig()
  
  // 현재 선택된 색상과 뷰에 맞는 모자 이미지 URL을 찾습니다.
  // config.colors 배열에서 hatColor와 일치하는 색상 정보를 찾고, 해당 색상의 views 객체에서 currentView에 해당하는 이미지를 가져옵니다.
  const hatImage = config.colors.find(c => c.id === hatColor)?.views[currentView] || ""
  
  // 현재 뷰에 정의된 인쇄 안전 영역(safe zone) 정보를 가져옵니다.
  // 이 영역은 사용자가 디자인을 배치할 수 있는 유효 범위를 시각적으로 표시하는 데 사용됩니다.
  const zone = config.safeZones[currentView]
  
  // 전체 레이어 중 현재 보고 있는 뷰(view)에 속한 레이어만 필터링합니다.
  // 다른 뷰의 레이어는 현재 화면에 렌더링되지 않도록 합니다.
  const currentLayers = layers.filter(l => l.view === currentView)
  
  // 정규화된 좌표를 실제 픽셀 좌표로 변환 (BASE_SIZE 기준 → 현재 스케일)
  const toPixel = useCallback((value: number) => value * scale, [scale])
  
  // 실제 픽셀 좌표를 정규화된 좌표로 변환 (현재 스케일 → BASE_SIZE 기준)
  const toNormalized = useCallback((value: number) => value / scale, [scale])

  // 사용 가능한 뷰 목록 정의 (UI 버튼 생성용)
  const views: {id: HatView, label: string}[] = [
      { id: 'front', label: 'Front' }, // 정면
      { id: 'left', label: 'Left' },   // 좌측면
      { id: 'right', label: 'Right' }, // 우측면
      { id: 'back', label: 'Back' },   // 후면
      { id: 'top', label: 'Top' },     // 윗면
  ]

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#F3F4F6]">
       {/* 상단 캔버스 컨트롤 (현재는 주석 처리되어 시각적 요소만 남음) */}
       {/* 회전, 삭제 등 추가적인 조작 버튼을 배치할 수 있는 영역입니다. */}
       {/* <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-sm border p-1 flex gap-1 z-10">
          <Button variant="ghost" size="icon" className="h-8 w-8"><RotateCcw className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8"><RotateCw className="h-4 w-4" /></Button>
          <div className="w-px bg-gray-200 h-6 my-auto mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
       </div> */}

       {/* 하단 뷰 스위처 (View Switcher) */}
       {/* 사용자가 모자의 보는 방향(앞, 뒤, 좌, 우, 위)을 전환할 수 있는 버튼 그룹입니다. */}
       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border p-1 flex gap-1 z-20">
          {views.map(v => (
              <button
                key={v.id}
                onClick={() => onViewChange(v.id)} // 버튼 클릭 시 해당 뷰로 전환
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    currentView === v.id ? "bg-black text-white" : "hover:bg-gray-100 text-gray-600"
                } `} // 현재 선택된 뷰는 검은색 배경으로 강조 표시합니다.
              >
                  {v.label}
              </button>
          ))}
       </div>

       {/* 좌측 플로팅 레이어 패널 (Floating Layers Panel) */}
       {/* 현재 뷰에 배치된 레이어들의 목록을 보여줍니다. (PC 화면에서만 표시: lg:block) */}
       <div className="absolute top-4 left-4 w-48 bg-white rounded-lg shadow-sm border p-3 z-10 hidden lg:block">
            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Layers ({currentView})</h3>
            <div className="space-y-2">
                {/* 기본 모자 배경 레이어 표시 */}
                <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-sm font-medium border border-blue-100">
                    <Box className="w-4 h-4" />
                    Base Hat ({hatColor})
                </div>
                
                {/* 레이어가 없을 경우 안내 메시지 */}
                {currentLayers.length === 0 && <div className="text-xs text-center py-2 text-gray-400">No layers on this side</div>}
                
                {/* 각 레이어 아이템 렌더링 */}
                {currentLayers.map(layer => (
                    <div key={layer.id} className="flex items-center gap-2 p-2 bg-white hover:bg-gray-50 rounded text-sm font-medium border cursor-pointer group">
                        {/* 레이어 미리보기 (이미지 또는 텍스트 아이콘) */}
                        <div className="w-4 h-4 rounded overflow-hidden relative flex items-center justify-center bg-gray-100">
                             {layer.type === 'image' ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={layer.content} alt="layer" className="w-full h-full object-cover" />
                             ) : (
                                <span className="text-[10px] font-bold">T</span>
                             )}
                        </div>
                        {/* 레이어 이름/내용 표시 */}
                        <span className="truncate max-w-[100px]">{layer.type === 'text' ? layer.content : 'Image Layer'}</span>
                        {/* 삭제 버튼 (호버 시에만 표시) */}
                        <X 
                            className="ml-auto h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-500" 
                            onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }} 
                        />
                    </div>
                ))}
            </div>
       </div>

      {/* 메인 캔버스 영역 */}
      {/* 최소 크기를 설정하여 일정 크기 이하로 줄어들지 않도록 합니다. */}
      <div 
        ref={containerRef}
        className="relative w-full h-full max-w-[800px] max-h-[800px] aspect-square"
        style={{
          minWidth: `${BASE_SIZE * MIN_SCALE}px`,
          minHeight: `${BASE_SIZE * MIN_SCALE}px`,
        }}
      >
        {/* 모자 기본 이미지 및 레이어 컨테이너 */}
        {/* 레이어가 모자 이미지와 동일한 영역에 배치되도록 함 */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
            {/* 모자 이미지 영역 - 레이어가 이 영역 기준으로 배치됨 */}
            <div 
                ref={hatAreaRef}
                className="relative w-full h-full"
            >
                {/* 현재 뷰 표시 배지 (좌측 상단) */}
                <div className="absolute top-0 left-0 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 pointer-events-none">
                    {currentView.toUpperCase()} VIEW
                </div>

                {/* 모자 이미지 렌더링 */}
                {/* 
                    - pointer-events-none: 이미지가 클릭 이벤트를 가로채지 않도록 하여 드래그 동작 등을 방해하지 않음
                    - scale-x-[-1]: 우측면 뷰에서 모자 이미지가 반전되어야 하는 경우(검정색 제외) 좌우 반전 처리
                    - rotate-180: 윗면 뷰일 경우 180도 회전하여 올바른 방향으로 표시
                */}
                <img
                    src={hatImage}
                    alt={`${hatColor} ${currentView}`}
                    className={`absolute inset-0 w-full h-full object-contain pointer-events-none select-none drop-shadow-xl 
                        ${currentView === 'right' && hatColor !== 'black' ? 'scale-x-[-1]' : ''}
                        ${currentView === 'top' ? 'rotate-180' : ''}
                    `}
                />
                
                {/* 인쇄 가능 영역 표시 (Printable Zone Overlay) */}
                {/* 점선으로 표시되는 인쇄 영역 가이드입니다. */}
                <div 
                    className="absolute border-2 border-dashed border-blue-500/50 bg-blue-500/5 pointer-events-none z-[5]"
                    style={{
                        left: `${zone?.x || 30}%`,      // 안전 영역의 X 위치 (퍼센트)
                        top: `${zone?.y || 30}%`,       // 안전 영역의 Y 위치 (퍼센트)
                        width: `${zone?.width || 40}%`, // 안전 영역의 너비
                        height: `${zone?.height || 30}%`, // 안전 영역의 높이
                    }}
                >
                    {/* 영역 라벨 */}
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1 rounded-bl">
                        PRINT AREA
            </div>
        </div>

        {/* 드래그 가능한 레이어들 (Draggable Layers) */}
                {/* 레이어가 모자 이미지 영역 내부에 배치되어 화면 크기 변경 시에도 올바른 위치를 유지합니다. */}
                {currentLayers.map(layer => {
                    // 레이어의 회전 및 반전 변환 스타일 계산
                    const rotation = layer.rotation || 0
                    const scaleX = layer.flipX ? -1 : 1
                    const scaleY = layer.flipY ? -1 : 1
                    const transformStyle = `rotate(${rotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`

                    return (
             <Rnd
                key={layer.id}
                        position={{
                            x: toPixel(layer.x),
                            y: toPixel(layer.y),
                        }}
                        size={{
                            width: toPixel(layer.width || 150),
                            height: toPixel(layer.height || 150),
                        }}
                        bounds="parent" // 드래그 범위를 모자 이미지 영역 내로 제한
                className="z-10 group border-2 border-transparent hover:border-blue-500/50 transition-colors" // 호버 시 테두리 표시
                lockAspectRatio={layer.type === 'image'} // 이미지는 비율 유지
                        scale={scale} // 현재 스케일을 Rnd에 전달하여 드래그/리사이즈 정확도 향상
                        onDragStop={(e, d) => {
                            // 드래그 완료 시 정규화된 좌표로 저장
                            onUpdateLayer?.(layer.id, {
                                x: toNormalized(d.x),
                                y: toNormalized(d.y),
                            })
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            // 리사이즈 완료 시 정규화된 크기와 위치로 저장
                            onUpdateLayer?.(layer.id, {
                                x: toNormalized(position.x),
                                y: toNormalized(position.y),
                                width: toNormalized(parseFloat(ref.style.width)),
                                height: toNormalized(parseFloat(ref.style.height)),
                            })
                        }}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                            {/* 이미지에 회전/반전 변환 적용 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={layer.content} 
                        alt="Logo" 
                                className="w-full h-full object-contain pointer-events-none transition-transform duration-200" 
                                style={{ transform: transformStyle }}
                            />
                            
                            {/* 레이어 컨트롤 패널 (호버 시 표시) */}
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white border shadow-lg rounded-lg p-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                {/* 45도 반시계 방향 회전 */}
                                <button 
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const newRotation = ((layer.rotation || 0) - 45 + 360) % 360
                                        onUpdateLayer?.(layer.id, { rotation: newRotation })
                                    }}
                                    title="45° 반시계 회전"
                                >
                                    <RotateCcw size={14} />
                                </button>
                                
                                {/* 45도 시계 방향 회전 */}
                                <button 
                                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-900 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        const newRotation = ((layer.rotation || 0) + 45) % 360
                                        onUpdateLayer?.(layer.id, { rotation: newRotation })
                                    }}
                                    title="45° 시계 회전"
                                >
                                    <RotateCw size={14} />
                                </button>
                                
                                <div className="w-px bg-gray-200 my-1" />
                                
                                {/* 좌우 반전 */}
                                <button 
                                    className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${layer.flipX ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onUpdateLayer?.(layer.id, { flipX: !layer.flipX })
                                    }}
                                    title="좌우 반전"
                                >
                                    <FlipHorizontal size={14} />
                                </button>
                                
                                {/* 상하 반전 */}
                                <button 
                                    className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${layer.flipY ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onUpdateLayer?.(layer.id, { flipY: !layer.flipY })
                                    }}
                                    title="상하 반전"
                                >
                                    <FlipVertical size={14} />
                                </button>
                                
                                <div className="w-px bg-gray-200 my-1" />
                                
                                {/* 삭제 버튼 */}
                                <button 
                                    className="p-1.5 hover:bg-red-50 rounded text-gray-600 hover:text-red-500 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRemoveLayer(layer.id)
                                    }}
                                    title="삭제"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            
                            {/* 회전 각도 표시 (0이 아닐 때만) */}
                            {rotation !== 0 && (
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {rotation}°
                                </div>
                            )}
                            
                            {/* 레이어 삭제 버튼 (우측 상단 - 빠른 접근용) */}
                            <div className="absolute -top-3 -right-3 bg-white border shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-red-500 hover:text-red-600 z-20">
                        <X size={14} onClick={() => onRemoveLayer(layer.id)} />
                    </div>
                </div>
            </Rnd>
                    )
                })}
            </div>
        </div>
      </div>
    </div>
  )
}
