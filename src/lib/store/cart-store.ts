"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DesignLayer } from "./design-store";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";
import type { PriceTier } from "@/domain/product/types";
import { getUnitPrice } from "@/lib/pricing/price-calculator";

/**
 * 장바구니 아이템 인터페이스
 * 각 아이템은 특정 색상의 디자인 + 사이즈 + 수량 조합
 */
export interface CartItem {
  id: string; // 장바구니 아이템 고유 ID
  productId: string; // 상품 ID (현재는 'custom-hat')
  productName: string; // 상품명
  color: string; // 모자 색상 ID
  colorLabel: string; // 모자 색상 라벨 (예: "Midnight Black")
  colorHex?: string; // 모자 색상 HEX 코드 (예: "#1a1a2e")
  size: string; // 사이즈 (S, M, L, XL, FREE)
  quantity: number; // 수량
  designLayers: DesignLayer[]; // 해당 색상의 디자인 레이어들
  unitPrice: number; // 단가 (할인 적용 후)
  basePrice: number; // 기본 단가 (할인 전 원가)
  priceTiers?: PriceTier[]; // 수량 구간별 할인 가격표
  createdAt: number; // 생성 시간
}

/**
 * 장바구니 상태 인터페이스
 */
interface CartState {
  // === 상태 ===
  items: CartItem[];
  userId: string | null; // 로그인한 사용자 ID
  isSyncing: boolean; // DB 동기화 중 여부

  // === 계산된 값 ===
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getShippingCost: () => number;
  getGrandTotal: () => number;

  // === 액션 ===
  addItem: (item: Omit<CartItem, "id" | "createdAt">) => {
    merged: boolean;
    newQuantity: number;
  };
  updateItemQuantity: (id: string, quantity: number) => void;
  updateItemDesign: (id: string, designLayers: DesignLayer[]) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;

  // 같은 색상+사이즈 조합이 있는지 확인
  findExistingItem: (
    color: string,
    size: string,
    designLayers: DesignLayer[],
  ) => CartItem | undefined;

  // === DB 동기화 ===
  setUserId: (userId: string | null) => void;
  syncFromDB: () => Promise<void>;
  syncToDB: () => Promise<void>;
}

// ID 생성기
const generateId = () =>
  `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 디자인 레이어 비교 (간단한 비교 - 실제로는 더 정교한 비교 필요할 수 있음)
const areDesignsEqual = (
  layers1: DesignLayer[],
  layers2: DesignLayer[],
): boolean => {
  if (layers1.length !== layers2.length) return false;

  // 각 레이어의 주요 속성 비교
  return layers1.every((layer1, index) => {
    const layer2 = layers2[index];
    return (
      layer1.content === layer2.content &&
      layer1.view === layer2.view &&
      Math.abs(layer1.x - layer2.x) < 1 &&
      Math.abs(layer1.y - layer2.y) < 1 &&
      layer1.rotation === layer2.rotation &&
      layer1.flipX === layer2.flipX &&
      layer1.flipY === layer2.flipY
    );
  });
};

/**
 * 장바구니 스토어
 * - 로그인 시 DB와 동기화
 * - 비로그인 시 localStorage 사용
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // === 초기 상태 ===
      items: [],
      userId: null,
      isSyncing: false,

      // === 계산된 값 ===
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0,
        );
      },

      getShippingCost: () => {
        const total = get().getTotalPrice();
        // 5만원 이상 무료배송, 그 외 3000원
        return total >= 50000 ? 0 : 3000;
      },

      getGrandTotal: () => {
        return get().getTotalPrice() + get().getShippingCost();
      },

      // === 액션 ===
      addItem: (itemData) => {
        const newItem: CartItem = {
          ...itemData,
          id: generateId(),
          createdAt: Date.now(),
        };

        // 같은 색상 + 사이즈 + 동일 디자인이 있는지 먼저 확인
        const existingIndex = get().items.findIndex(
          (item) =>
            item.color === itemData.color &&
            item.size === itemData.size &&
            areDesignsEqual(item.designLayers, itemData.designLayers),
        );

        const merged = existingIndex >= 0;
        let newQuantity = itemData.quantity;

        set((state) => {
          if (existingIndex >= 0) {
            const updatedItems = [...state.items];
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity:
                updatedItems[existingIndex].quantity + itemData.quantity,
            };
            newQuantity = updatedItems[existingIndex].quantity;
            return { items: updatedItems };
          }

          return { items: [...state.items, newItem] };
        });

        // DB 동기화 (로그인 상태인 경우)
        if (get().userId) {
          get().syncToDB();
        }

        return { merged, newQuantity };
      },

      updateItemQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            // 수량 변경 시 할인가 재계산
            const newUnitPrice = getUnitPrice(
              item.basePrice,
              quantity,
              item.priceTiers,
            );
            return { ...item, quantity, unitPrice: newUnitPrice };
          }),
        }));

        // DB 동기화
        if (get().userId) {
          get().syncToDB();
        }
      },

      updateItemDesign: (id, designLayers) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, designLayers } : item,
          ),
        }));

        // DB 동기화
        if (get().userId) {
          get().syncToDB();
        }
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        // DB 동기화
        if (get().userId) {
          get().syncToDB();
        }
      },

      clearCart: () => {
        set({ items: [] });

        // DB 동기화 (장바구니 비우기)
        if (get().userId) {
          get().syncToDB();
        }
      },

      findExistingItem: (color, size, designLayers) => {
        return get().items.find(
          (item) =>
            item.color === color &&
            item.size === size &&
            areDesignsEqual(item.designLayers, designLayers),
        );
      },

      // === DB 동기화 ===
      setUserId: (userId) => {
        const previousUserId = get().userId;
        set({ userId });

        // 로그인 상태가 변경되면 DB 동기화
        if (userId && !previousUserId) {
          // 로그인 시: DB에서 장바구니 불러오기
          get().syncFromDB();
        } else if (!userId && previousUserId) {
          // 로그아웃 시: 장바구니 초기화
          set({ items: [] });
        }
      },

      syncFromDB: async () => {
        const { userId } = get();
        if (!userId) return;

        set({ isSyncing: true });

        try {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase
            .schema("runhousecustom")
            .from("user_carts")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });

          if (error) {
            console.error("장바구니 불러오기 에러:", error);
            return;
          }

          const localItems = get().items;

          if (data && data.length > 0) {
            // DB의 장바구니 데이터를 CartItem 형식으로 변환
            const dbItems: CartItem[] = data.map((item) => ({
              id: item.id,
              productId: item.product_id,
              productName: item.product_name,
              color: item.color,
              colorLabel: item.color_label,
              size: item.size,
              quantity: item.quantity,
              designLayers: item.design_layers as DesignLayer[],
              unitPrice: item.unit_price,
              basePrice:
                ((item as Record<string, unknown>).base_price as number) ||
                item.unit_price,
              priceTiers: (item as Record<string, unknown>).price_tiers as
                | PriceTier[]
                | undefined,
              createdAt: new Date(item.created_at).getTime(),
            }));

            // 로컬 장바구니와 병합 (DB 우선)
            const mergedItems = [...dbItems];

            // 로컬에만 있는 아이템 추가
            localItems.forEach((localItem) => {
              const existsInDB = dbItems.some(
                (dbItem) =>
                  dbItem.color === localItem.color &&
                  dbItem.size === localItem.size &&
                  areDesignsEqual(dbItem.designLayers, localItem.designLayers),
              );
              if (!existsInDB) {
                mergedItems.push(localItem);
              }
            });

            set({ items: mergedItems });

            // 병합된 장바구니를 다시 DB에 저장
            if (localItems.length > 0) {
              await get().syncToDB();
            }
          } else if (localItems.length > 0) {
            // DB 장바구니가 비어있으면 로컬 장바구니를 최초 업로드
            await get().syncToDB();
          }
        } catch (error) {
          console.error("장바구니 동기화 에러:", error);
        } finally {
          set({ isSyncing: false });
        }
      },

      syncToDB: async () => {
        const { userId, items } = get();
        if (!userId) return;

        try {
          const supabase = getSupabaseBrowserClient();

          // 기존 장바구니 삭제
          const { error: deleteError } = await supabase
            .schema("runhousecustom")
            .from("user_carts")
            .delete()
            .eq("user_id", userId);
          if (deleteError) {
            console.error("장바구니 삭제 에러:", deleteError);
            return;
          }

          // 현재 장바구니 저장
          if (items.length > 0) {
            const cartData = items.map((item) => ({
              user_id: userId,
              product_id: item.productId,
              product_name: item.productName,
              color: item.color,
              color_label: item.colorLabel,
              size: item.size,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              design_layers: item.designLayers,
            }));

            const { error } = await supabase
              .schema("runhousecustom")
              .from("user_carts")
              .insert(cartData);

            if (error) {
              console.error("장바구니 저장 에러:", error);
            }
          }
        } catch (error) {
          console.error("장바구니 DB 동기화 에러:", error);
        }
      },
    }),
    {
      name: "runhouse-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        // userId는 localStorage에 저장하지 않음
      }),
    },
  ),
);

/**
 * 색상별 장바구니 아이템 그룹화
 */
export const useCartItemsByColor = () => {
  const items = useCartStore((state) => state.items);

  const grouped: Record<string, CartItem[]> = {};
  items.forEach((item) => {
    if (!grouped[item.color]) {
      grouped[item.color] = [];
    }
    grouped[item.color].push(item);
  });

  return grouped;
};
