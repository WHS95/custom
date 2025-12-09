import React, { useRef } from "react"
import { Rnd } from "react-rnd"
import { X, RotateCcw, RotateCw, Trash2, Maximize, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStudioConfig, HatView } from "@/lib/store/studio-context"

/**
 * 레이어 인터페이스 정의
 * 캔버스 위에 올라가는 각 디자인 요소(이미지, 텍스트 등)의 데이터 구조입니다.
 */
export interface Layer {
    id: string              // 레이어의 고유 식별자
    type: 'image' | 'text'  // 레이어 타입 (이미지 또는 텍스트)
    content: string         // 내용 (이미지 URL 또는 텍스트 문자열)
    x: number               // 캔버스 내 x 좌표
    y: number               // 캔버스 내 y 좌표
    width?: number          // 너비 (선택적)
    height?: number         // 높이 (선택적)
    color?: string          // 텍스트 색상 (선택적)
    view: HatView           // 해당 레이어가 속한 모자 뷰 (front, back 등)
}

/**
 * HatCanvasProps 인터페이스
 * HatCanvas 컴포넌트에 전달되는 props의 타입을 정의합니다.
 */
interface HatCanvasProps {
  hatColor: string                        // 현재 선택된 모자 색상 ID
  currentView: HatView                    // 현재 보고 있는 모자 뷰 (앞, 뒤, 좌, 우, 위)
  onViewChange: (view: HatView) => void   // 뷰 변경 시 호출될 콜백 함수
  layers: Layer[]                         // 전체 레이어 목록
  onRemoveLayer: (id: string) => void     // 레이어 삭제 시 호출될 콜백 함수
}

/**
 * HatCanvas 컴포넌트
 * 모자 디자인 스튜디오의 메인 캔버스 영역을 담당합니다.
 * 사용자는 여기서 모자의 뷰를 변경하고, 디자인 레이어를 확인 및 조작할 수 있습니다.
 */
export function HatCanvas({ hatColor, currentView, onViewChange, layers, onRemoveLayer }: HatCanvasProps) {
  // 캔버스 컨테이너에 대한 참조 (드래그 앤 드롭 범위 제한 등에 사용될 수 있음)
  const containerRef = useRef<HTMLDivElement>(null)
  
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
      <div 
        ref={containerRef}
        className="relative w-full h-full max-w-[800px] max-h-[800px] aspect-square"
      >
        {/* 모자 기본 이미지 (Base Hat Image) */}
        <div className="absolute inset-0 flex items-center justify-center p-12 ">
            <div className="relative w-full h-full">
                {/* 현재 뷰 표시 배지 (좌측 상단) */}
                <div className="absolute top-0 left-0  text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 pointer-events-none">
                    {currentView.toUpperCase()} VIEW
                </div>

                {/* 모자 이미지 렌더링 */}
                {/* 
                    - pointer-events-none: 이미지가 클릭 이벤트를 가로채지 않도록 하여 드래그 동작 등을 방헤하지 않음
                    - scale-x-[-1]: 우측면 뷰에서 모자 이미지가 반전되어야 하는 경우(검정색 제외) 좌우 반전 처리
                    - rotate-180: 윗면 뷰일 경우 180도 회전하여 올바른 방향으로 표시
                */}
                <img
                    src={hatImage}
                    alt={`${hatColor} ${currentView}`}
                    className={`bg-gray-50 w-full h-full object-contain pointer-events-none select-none drop-shadow-xl 
                        ${currentView === 'right' && hatColor !== 'black' ? 'scale-x-[-1]' : ''}
                        ${currentView === 'top' ? 'rotate-180' : ''}
                    `}
                />
                
                {/* 인쇄 가능 영역 표시 (Printable Zone Overlay) */}
                {/* 점선으로 표시되는 인쇄 영역 가이드입니다. */}
                <div 
                    className="absolute border-2 border-dashed border-blue-500/50 bg-blue-500/5 pointer-events-none"
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
            </div>
        </div>

        {/* 드래그 가능한 레이어들 (Draggable Layers) */}
        {/* react-rnd 라이브러리를 사용하여 크기 조절 및 드래그 가능한 요소를 렌더링합니다. */}
        {currentLayers.map(layer => (
             <Rnd
                key={layer.id}
                default={{
                    x: layer.x,
                    y: layer.y,
                    width: layer.width || 150,
                    height: layer.height || 150,
                }}
                bounds={containerRef.current || "parent"} // 드래그 범위를 캔버스 내로 제한
                className="z-10 group border-2 border-transparent hover:border-blue-500/50 transition-colors" // 호버 시 테두리 표시
                lockAspectRatio={layer.type === 'image'} // 이미지는 비율 유지
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                        src={layer.content} 
                        alt="Logo" 
                        className="w-full h-full object-contain pointer-events-none" 
                    />
                    {/* 레이어 삭제 버튼 (개별 레이어 우측 상단에 표시) */}
                    <div className="absolute -top-3 -right-3 bg-white border shadow-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-red-500 hover:text-red-600">
                        <X size={14} onClick={() => onRemoveLayer(layer.id)} />
                    </div>
                </div>
            </Rnd>
        ))}
      </div>
    </div>
  )
}
