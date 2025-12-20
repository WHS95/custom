"use client"

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { DesignLayer } from './design-store'

/**
 * 장바구니 아이템 인터페이스
 * 각 아이템은 특정 색상의 디자인 + 사이즈 + 수량 조합
 */
export interface CartItem {
    id: string                  // 장바구니 아이템 고유 ID
    productId: string           // 상품 ID (현재는 'custom-hat')
    productName: string         // 상품명
    color: string               // 모자 색상 ID
    colorLabel: string          // 모자 색상 라벨 (예: "Midnight Black")
    size: string                // 사이즈 (S, M, L, XL, FREE)
    quantity: number            // 수량
    designLayers: DesignLayer[] // 해당 색상의 디자인 레이어들
    unitPrice: number           // 단가
    createdAt: number           // 생성 시간
}

/**
 * 장바구니 상태 인터페이스
 */
interface CartState {
    // === 상태 ===
    items: CartItem[]
    
    // === 계산된 값 ===
    getTotalItems: () => number
    getTotalPrice: () => number
    getShippingCost: () => number
    getGrandTotal: () => number
    
    // === 액션 ===
    addItem: (item: Omit<CartItem, 'id' | 'createdAt'>) => void
    updateItemQuantity: (id: string, quantity: number) => void
    removeItem: (id: string) => void
    clearCart: () => void
    
    // 같은 색상+사이즈 조합이 있는지 확인
    findExistingItem: (color: string, size: string, designLayers: DesignLayer[]) => CartItem | undefined
}

// ID 생성기
const generateId = () => `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// 디자인 레이어 비교 (간단한 비교 - 실제로는 더 정교한 비교 필요할 수 있음)
const areDesignsEqual = (layers1: DesignLayer[], layers2: DesignLayer[]): boolean => {
    if (layers1.length !== layers2.length) return false
    
    // 각 레이어의 주요 속성 비교
    return layers1.every((layer1, index) => {
        const layer2 = layers2[index]
        return layer1.content === layer2.content &&
               layer1.view === layer2.view &&
               Math.abs(layer1.x - layer2.x) < 1 &&
               Math.abs(layer1.y - layer2.y) < 1 &&
               layer1.rotation === layer2.rotation &&
               layer1.flipX === layer2.flipX &&
               layer1.flipY === layer2.flipY
    })
}

/**
 * 장바구니 스토어
 */
export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            // === 초기 상태 ===
            items: [],
            
            // === 계산된 값 ===
            getTotalItems: () => {
                return get().items.reduce((sum, item) => sum + item.quantity, 0)
            },
            
            getTotalPrice: () => {
                return get().items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
            },
            
            getShippingCost: () => {
                const total = get().getTotalPrice()
                // 5만원 이상 무료배송, 그 외 3000원
                return total >= 50000 ? 0 : 3000
            },
            
            getGrandTotal: () => {
                return get().getTotalPrice() + get().getShippingCost()
            },
            
            // === 액션 ===
            addItem: (itemData) => {
                const newItem: CartItem = {
                    ...itemData,
                    id: generateId(),
                    createdAt: Date.now(),
                }
                
                set((state) => {
                    // 같은 색상 + 사이즈 + 동일 디자인이 있으면 수량만 증가
                    const existingIndex = state.items.findIndex(item => 
                        item.color === itemData.color && 
                        item.size === itemData.size &&
                        areDesignsEqual(item.designLayers, itemData.designLayers)
                    )
                    
                    if (existingIndex >= 0) {
                        const updatedItems = [...state.items]
                        updatedItems[existingIndex] = {
                            ...updatedItems[existingIndex],
                            quantity: updatedItems[existingIndex].quantity + itemData.quantity
                        }
                        return { items: updatedItems }
                    }
                    
                    return { items: [...state.items, newItem] }
                })
            },
            
            updateItemQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id)
                    return
                }
                
                set((state) => ({
                    items: state.items.map(item =>
                        item.id === id ? { ...item, quantity } : item
                    )
                }))
            },
            
            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter(item => item.id !== id)
                }))
            },
            
            clearCart: () => {
                set({ items: [] })
            },
            
            findExistingItem: (color, size, designLayers) => {
                return get().items.find(item =>
                    item.color === color &&
                    item.size === size &&
                    areDesignsEqual(item.designLayers, designLayers)
                )
            },
        }),
        {
            name: 'runhouse-cart-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)

/**
 * 색상별 장바구니 아이템 그룹화
 */
export const useCartItemsByColor = () => {
    const items = useCartStore((state) => state.items)
    
    const grouped: Record<string, CartItem[]> = {}
    items.forEach(item => {
        if (!grouped[item.color]) {
            grouped[item.color] = []
        }
        grouped[item.color].push(item)
    })
    
    return grouped
}

