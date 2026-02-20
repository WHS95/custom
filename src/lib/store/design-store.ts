"use client"

import { create } from 'zustand'
import { HatView } from './studio-context'

/**
 * 레이어 인터페이스
 * 각 디자인 레이어(로고, 텍스트 등)의 데이터 구조
 */
export interface DesignLayer {
    id: string              // 레이어 고유 식별자
    type: 'image' | 'text'  // 레이어 타입
    content: string         // 내용 (이미지 URL/base64 또는 텍스트)
    x: number               // X 좌표 (정규화된 값)
    y: number               // Y 좌표 (정규화된 값)
    width: number           // 너비 (정규화된 값)
    height: number          // 높이 (정규화된 값)
    rotation: number        // 회전 각도 (0, 45, 90, ...)
    flipX: boolean          // 좌우 반전
    flipY: boolean          // 상하 반전
    view: HatView           // 해당 레이어가 속한 뷰 (front, back, left, right, top)
    color?: string          // 텍스트 색상 (텍스트 레이어용)
    fontSize?: number       // 폰트 크기 (텍스트 레이어용, 기본 24)
    fontFamily?: string     // 폰트 패밀리 (텍스트 레이어용)
}

/**
 * 디자인 상태 인터페이스
 * 전체 디자인 세션의 상태를 관리
 * 
 * 핵심 변경: layersByColor로 색상별 레이어 분리 저장
 */
// 히스토리 최대 크기
const MAX_HISTORY = 30

interface DesignState {
    // === 상태 ===
    sessionId: string                           // 현재 디자인 세션 ID
    selectedColor: string                       // 선택된 모자 색상
    currentView: HatView                        // 현재 보고 있는 뷰
    layersByColor: Record<string, DesignLayer[]>  // 색상별 레이어 저장
    selectedLayerId: string | null              // 현재 선택된 레이어 ID
    lastUpdated: number                         // 마지막 업데이트 타임스탬프

    // === Undo/Redo 히스토리 ===
    history: Record<string, DesignLayer[]>[]    // 과거 상태 스택
    future: Record<string, DesignLayer[]>[]     // Redo용 스택

    // === 계산된 값 (현재 색상 기준) ===
    getCurrentLayers: () => DesignLayer[]       // 현재 색상의 레이어들
    getLayersForColor: (color: string) => DesignLayer[]  // 특정 색상의 레이어들
    hasDesignForColor: (color: string) => boolean  // 특정 색상에 디자인이 있는지
    canUndo: () => boolean
    canRedo: () => boolean

    // === 액션 ===
    // 색상 관련
    setSelectedColor: (color: string) => void

    // 뷰 관련
    setCurrentView: (view: HatView) => void

    // 레이어 CRUD (현재 선택된 색상 기준)
    addLayer: (layer: Omit<DesignLayer, 'id'>) => string
    updateLayer: (id: string, updates: Partial<DesignLayer>) => void
    removeLayer: (id: string) => void
    selectLayer: (id: string | null) => void

    // 레이어 변환 (회전, 반전)
    rotateLayer: (id: string, degrees: number) => void
    flipLayerX: (id: string) => void
    flipLayerY: (id: string) => void

    // 색상별 디자인 관리
    clearColorDesign: (color: string) => void   // 특정 색상의 디자인만 초기화
    copyDesignToColor: (fromColor: string, toColor: string) => void  // 디자인 복사
    setLayersForColor: (color: string, layers: DesignLayer[]) => void  // 특정 색상에 레이어 설정 (장바구니에서 수정 시 사용)

    // Undo/Redo
    undo: () => void
    redo: () => void

    // 세션 관리
    clearDesign: () => void
    newSession: () => void
}

// 간단한 ID 생성기
const generateId = () => Math.random().toString(36).substr(2, 9)

// 새 세션 ID 생성
const generateSessionId = () => `session_${Date.now()}_${generateId()}`

/**
 * 디자인 스토어
 * 색상별로 레이어를 분리 저장하여 각 색상에 다른 디자인 적용 가능
 * localStorage 저장 기능 제거됨 - 세션 중에만 데이터 유지
 */
// layersByColor 딥카피 헬퍼
const cloneLayers = (layers: Record<string, DesignLayer[]>): Record<string, DesignLayer[]> => {
    const result: Record<string, DesignLayer[]> = {}
    for (const key in layers) {
        result[key] = layers[key].map(l => ({ ...l }))
    }
    return result
}

export const useDesignStore = create<DesignState>((set, get) => {
    // 히스토리에 현재 상태 저장 (변경 전 호출)
    const pushHistory = () => {
        const { layersByColor, history } = get()
        const newHistory = [...history, cloneLayers(layersByColor)]
        if (newHistory.length > MAX_HISTORY) {
            newHistory.shift()
        }
        set({ history: newHistory, future: [] })
    }

    return {
            // === 초기 상태 ===
            sessionId: generateSessionId(),
            selectedColor: 'black',
            currentView: 'front',
            layersByColor: {},  // { 'black': [...], 'khaki': [...], ... }
            selectedLayerId: null,
            lastUpdated: Date.now(),
            history: [],
            future: [],

            // === 계산된 값 ===
            getCurrentLayers: () => {
                const { layersByColor, selectedColor } = get()
                return layersByColor[selectedColor] || []
            },

            getLayersForColor: (color: string) => {
                return get().layersByColor[color] || []
            },

            hasDesignForColor: (color: string) => {
                const layers = get().layersByColor[color]
                return layers && layers.length > 0
            },

            canUndo: () => get().history.length > 0,
            canRedo: () => get().future.length > 0,

            // === 색상 관련 액션 ===
            setSelectedColor: (color) => set({ 
                selectedColor: color,
                selectedLayerId: null,  // 색상 변경 시 선택 해제
                lastUpdated: Date.now()
            }),

            // === 뷰 관련 액션 ===
            setCurrentView: (view) => set({ 
                currentView: view,
                lastUpdated: Date.now()
            }),

            // === 레이어 CRUD 액션 ===
            addLayer: (layerData) => {
                pushHistory()
                const id = generateId()
                const { selectedColor } = get()

                const newLayer: DesignLayer = {
                    ...layerData,
                    id,
                    width: layerData.width || 100,
                    height: layerData.height || 100,
                    rotation: layerData.rotation || 0,
                    flipX: layerData.flipX || false,
                    flipY: layerData.flipY || false,
                }

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [selectedColor]: [...(state.layersByColor[selectedColor] || []), newLayer]
                    },
                    selectedLayerId: id,
                    lastUpdated: Date.now()
                }))

                return id
            },

            updateLayer: (id, updates) => {
                pushHistory()
                const { selectedColor } = get()

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [selectedColor]: (state.layersByColor[selectedColor] || []).map(layer =>
                            layer.id === id ? { ...layer, ...updates } : layer
                        )
                    },
                    lastUpdated: Date.now()
                }))
            },

            removeLayer: (id) => {
                pushHistory()
                const { selectedColor } = get()

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [selectedColor]: (state.layersByColor[selectedColor] || []).filter(
                            layer => layer.id !== id
                        )
                    },
                    selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
                    lastUpdated: Date.now()
                }))
            },

            selectLayer: (id) => set({ selectedLayerId: id }),

            // === 레이어 변환 액션 ===
            rotateLayer: (id, degrees) => {
                pushHistory()
                const { selectedColor } = get()

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [selectedColor]: (state.layersByColor[selectedColor] || []).map(layer =>
                            layer.id === id 
                                ? { ...layer, rotation: (layer.rotation + degrees + 360) % 360 }
                                : layer
                        )
                    },
                    lastUpdated: Date.now()
                }))
            },

            flipLayerX: (id) => {
                pushHistory()
                const { selectedColor } = get()

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [selectedColor]: (state.layersByColor[selectedColor] || []).map(layer =>
                            layer.id === id ? { ...layer, flipX: !layer.flipX } : layer
                        )
                    },
                    lastUpdated: Date.now()
                }))
            },

            flipLayerY: (id) => {
                pushHistory()
                const { selectedColor } = get()

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [selectedColor]: (state.layersByColor[selectedColor] || []).map(layer =>
                            layer.id === id ? { ...layer, flipY: !layer.flipY } : layer
                        )
                    },
                    lastUpdated: Date.now()
                }))
            },

            // === 색상별 디자인 관리 ===
            clearColorDesign: (color) => {
                pushHistory()
                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [color]: []
                    },
                    lastUpdated: Date.now()
                }))
            },

            copyDesignToColor: (fromColor, toColor) => {
                pushHistory()
                const sourceLayers = get().layersByColor[fromColor] || []

                // 레이어 복사 (새 ID 부여)
                const copiedLayers = sourceLayers.map(layer => ({
                    ...layer,
                    id: generateId()
                }))

                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [toColor]: copiedLayers
                    },
                    lastUpdated: Date.now()
                }))
            },

            setLayersForColor: (color, layers) => {
                pushHistory()
                set((state) => ({
                    layersByColor: {
                        ...state.layersByColor,
                        [color]: layers
                    },
                    selectedColor: color,
                    lastUpdated: Date.now()
                }))
            },

            // === Undo/Redo 액션 ===
            undo: () => {
                const { history, layersByColor } = get()
                if (history.length === 0) return

                const previous = history[history.length - 1]
                const newHistory = history.slice(0, -1)

                set({
                    layersByColor: previous,
                    future: [cloneLayers(layersByColor), ...get().future],
                    history: newHistory,
                    selectedLayerId: null,
                    lastUpdated: Date.now()
                })
            },

            redo: () => {
                const { future, layersByColor } = get()
                if (future.length === 0) return

                const next = future[0]
                const newFuture = future.slice(1)

                set({
                    layersByColor: next,
                    history: [...get().history, cloneLayers(layersByColor)],
                    future: newFuture,
                    selectedLayerId: null,
                    lastUpdated: Date.now()
                })
            },

            // === 세션 관리 액션 ===
            clearDesign: () => set({
                layersByColor: {},
                selectedLayerId: null,
                history: [],
                future: [],
                lastUpdated: Date.now()
            }),

            newSession: () => set({
                sessionId: generateSessionId(),
                layersByColor: {},
                selectedLayerId: null,
                selectedColor: 'black',
                currentView: 'front',
                history: [],
                future: [],
                lastUpdated: Date.now()
            }),
        }
    })

/**
 * 현재 색상의 현재 뷰 레이어만 가져오는 셀렉터
 */
export const useCurrentViewLayers = () => {
    const layersByColor = useDesignStore((state) => state.layersByColor)
    const selectedColor = useDesignStore((state) => state.selectedColor)
    const currentView = useDesignStore((state) => state.currentView)
    
    const colorLayers = layersByColor[selectedColor] || []
    return colorLayers.filter(layer => layer.view === currentView)
}

/**
 * 현재 색상의 모든 레이어 가져오기
 */
export const useCurrentColorLayers = () => {
    const layersByColor = useDesignStore((state) => state.layersByColor)
    const selectedColor = useDesignStore((state) => state.selectedColor)
    return layersByColor[selectedColor] || []
}

/**
 * 선택된 레이어 가져오기
 */
export const useSelectedLayer = () => {
    const layersByColor = useDesignStore((state) => state.layersByColor)
    const selectedColor = useDesignStore((state) => state.selectedColor)
    const selectedLayerId = useDesignStore((state) => state.selectedLayerId)
    
    const colorLayers = layersByColor[selectedColor] || []
    return colorLayers.find(layer => layer.id === selectedLayerId) || null
}

/**
 * 디자인이 있는 색상 목록 가져오기
 */
export const useColorsWithDesign = () => {
    const layersByColor = useDesignStore((state) => state.layersByColor)
    return Object.keys(layersByColor).filter(color => layersByColor[color].length > 0)
}
