"use client"

import React from "react"
import { HatCanvas } from "./HatCanvas"
import { ProductSidebar } from "./ProductSidebar"
import { DesignToolbar } from "./DesignToolbar"
import { toast } from "sonner"
import { useDesignStore, useCurrentColorLayers } from "@/lib/store/design-store"
import { useStudioConfig } from "@/lib/store/studio-context"
import { getDefaultLayerPosition } from "@/components/shared/HatDesignCanvas"

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
export function StudioLayout() {
  // Zustand 스토어에서 상태와 액션 가져오기
  const selectedColor = useDesignStore((state) => state.selectedColor)
  const currentView = useDesignStore((state) => state.currentView)
  const setSelectedColor = useDesignStore((state) => state.setSelectedColor)
  const setCurrentView = useDesignStore((state) => state.setCurrentView)
  const addLayer = useDesignStore((state) => state.addLayer)
  const updateLayer = useDesignStore((state) => state.updateLayer)
  const removeLayer = useDesignStore((state) => state.removeLayer)

  // 스튜디오 설정 (안전 영역 등)
  const { config } = useStudioConfig()

  // 현재 색상의 모든 레이어 가져오기
  const currentColorLayers = useCurrentColorLayers()

  /**
   * 파일 업로드 핸들러
   * 이미지 파일을 읽어서 새 레이어로 추가
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      // 공통 함수를 사용하여 기본 위치 계산
      const defaultPos = getDefaultLayerPosition(currentView, config)

      addLayer({
        type: "image",
        content: ev.target?.result as string,
        ...defaultPos,
        view: currentView,
        rotation: 0,
        flipX: false,
        flipY: false,
      })

      toast.success("이미지 레이어가 추가되었습니다")
    }
    reader.readAsDataURL(file)

    // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
    e.target.value = ""
  }

  /**
   * 레이어 삭제 핸들러
   */
  const handleRemoveLayer = (id: string) => {
    removeLayer(id)
    toast.info("레이어가 삭제되었습니다")
  }

  /**
   * 레이어 업데이트 핸들러
   * 위치, 크기, 회전, 반전 등의 변경 처리
   */
  const handleUpdateLayer = (id: string, updates: Partial<typeof currentColorLayers[0]>) => {
    updateLayer(id, updates)
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
       
       {/* Main Canvas Area */}
       <div className="flex-1 relative">
            <HatCanvas 
                hatColor={selectedColor} 
                currentView={currentView}
                onViewChange={setCurrentView}
                layers={currentColorLayers}
                onRemoveLayer={handleRemoveLayer}
                onUpdateLayer={handleUpdateLayer}
            />
            
            {/* Floating Tool Bar */}
            <DesignToolbar 
                onUploadClick={() => document.getElementById('hidden-file-input')?.click()} 
            />
            
            {/* Hidden Input for Toolbar Action */}
            <input 
                id="hidden-file-input"
                type="file" 
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />
       </div>

       {/* Right Sidebar: Product & Commerce */}
       <ProductSidebar 
            selectedColor={selectedColor} 
            onColorChange={setSelectedColor}
       />
    </div>
  )
}
