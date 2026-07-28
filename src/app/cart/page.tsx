"use client";

import { useState, useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart-store";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import posthog from "posthog-js";
import { ArrowLeft, Trash2, Minus, Plus, ShoppingBag, ChevronDown, ChevronUp, Eye, Pencil, Layers, User } from "lucide-react";
import { useDesignStore } from "@/lib/store/design-store";
import { OrderFormData } from "@/components/cart/StepOrderForm";
import { OrderModal } from "@/components/cart/OrderModal";
import { CustomerSupportLink } from "@/components/cart/CustomerSupportLink";
import { GuestIntentModal } from "@/components/cart/GuestIntentModal";
import { getCrewDiscountAmount, getCrewDiscountLabel } from "@/lib/pricing/crew-discount";
import { Badge } from "@/components/ui/badge";
import { Users as UsersIcon } from "lucide-react";
import { CrewLoginInline } from "@/components/cart/CrewLoginInline";

const GUEST_INTENT_SEEN_KEY = "cart:guest_intent_shown";

interface AdminMessage {
  productId: string;
  productName: string;
  message: string;
}

const viewLabels: Record<string, string> = {
  front: "앞면",
  back: "뒷면",
  left: "좌측",
  right: "우측",
  top: "상단",
};

export default function CartPage() {
  const router = useRouter();
  const {
    user,
    profile,
    isLoading: authLoading,
    isAuthenticated,
    refreshProfile,
  } = useAuth();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getShippingCost = useCartStore((state) => state.getShippingCost);
  const getGrandTotal = useCartStore((state) => state.getGrandTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const [isOrdering, setIsOrdering] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [guestIntentOpen, setGuestIntentOpen] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const setLayersForColor = useDesignStore((state) => state.setLayersForColor);
  const setCurrentView = useDesignStore((state) => state.setCurrentView);
  const newSession = useDesignStore((state) => state.newSession);

  const handleEditDesign = (item: (typeof items)[0]) => {
    newSession();
    setLayersForColor(item.color, item.designLayers);
    const firstLayerView = item.designLayers[0]?.view;
    if (firstLayerView) {
      setCurrentView(firstLayerView);
    }
    router.push(`/studio/${item.productId}?mode=order&cartItemId=${item.id}`);
    toast.info(`${item.colorLabel} 디자인 수정 모드로 이동합니다`);
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  useEffect(() => {
    async function fetchAdminMessages() {
      if (items.length === 0) {
        setAdminMessages([]);
        return;
      }

      setIsLoadingMessages(true);
      const productIds = [...new Set(items.map((item) => item.productId))];

      try {
        const messages = await Promise.all(
          productIds.map(async (productId) => {
            try {
              const res = await fetch(`/api/products/${productId}`);
              const data = await res.json();
              if (data.success && data.data.adminMessage) {
                return {
                  productId,
                  productName: data.data.name,
                  message: data.data.adminMessage,
                };
              }
            } catch (err) {
              console.error(`Failed to fetch product ${productId}:`, err);
            }
            return null;
          })
        );

        setAdminMessages(messages.filter(Boolean) as AdminMessage[]);
      } catch (err) {
        console.error("Failed to fetch admin messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    fetchAdminMessages();
  }, [items]);

  // 인라인 크루 로그인 성공 → auth 새로고침 (크루 신원 + 10% 할인 반영)
  const handleCrewLoginSuccess = () => {
    refreshProfile();
    router.refresh();
    toast.success("크루로 로그인되었습니다! 10% 할인이 적용됩니다.");
  };

  // Analytics: open order modal (hat_order_started)
  const handleOpenOrderModal = () => {
    posthog.capture("hat_order_started");
    setOrderModalOpen(true);
  };

  /**
   * "주문하기" 클릭 통합 핸들러
   * - 로그인된 사용자: 바로 주문 모달
   * - 비로그인 사용자: 세션 내 첫 시도면 유도 모달 1회 → 그 다음부터는 바로 주문 모달
   */
  const handleOrderButtonClick = () => {
    if (isAuthenticated) {
      handleOpenOrderModal();
      return;
    }

    const alreadyShown =
      typeof window !== "undefined" &&
      sessionStorage.getItem(GUEST_INTENT_SEEN_KEY) === "1";

    if (alreadyShown) {
      handleOpenOrderModal();
      return;
    }

    sessionStorage.setItem(GUEST_INTENT_SEEN_KEY, "1");
    posthog.capture("guest_intent_modal_shown");
    setGuestIntentOpen(true);
  };

  // 유도 모달: 비회원으로 계속 진행
  const handleContinueAsGuest = () => {
    posthog.capture("guest_intent_continue_as_guest");
    setGuestIntentOpen(false);
    handleOpenOrderModal();
  };

  // 유도 모달 내 크루 로그인 성공
  const handleCrewLoginFromIntent = () => {
    posthog.capture("guest_intent_crew_login_success");
    setGuestIntentOpen(false);
    handleCrewLoginSuccess();
    // 로그인 직후 바로 주문 단계로
    handleOpenOrderModal();
  };

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      updateItemQuantity(id, item.quantity + delta);
    }
  };

  const handleOrder = async (
    formData: OrderFormData,
    attachmentFiles: File[]
  ) => {
    setIsOrdering(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 비회원 주문: userId 생략 → 백엔드에서 null 허용 (이미 지원)
          userId: user?.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || user?.email,
          shippingInfo: {
            recipientName: formData.recipientName,
            phone: formData.recipientPhone,
            zipCode: formData.zipCode,
            address: formData.address,
            addressDetail: formData.addressDetail,
            organizationName: formData.organizationName || undefined,
            memo: formData.memo || undefined,
          },
          items: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            color: item.color,
            colorLabel: item.colorLabel,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            designLayers: item.designLayers,
          })),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      const orderNumber = data.order.orderNumber;

      if (attachmentFiles.length > 0) {
        const uploadFormData = new FormData();
        attachmentFiles.forEach((file) => {
          uploadFormData.append("files", file);
        });

        const uploadResponse = await fetch(
          `/api/orders/${orderNumber}/attachments`,
          {
            method: "POST",
            body: uploadFormData,
          }
        );

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          console.error("첨부파일 업로드 실패:", uploadData.error);
          toast.warning("주문은 완료되었으나 첨부파일 업로드에 실패했습니다.");
        } else {
          toast.success(`${uploadData.files.length}개 파일이 첨부되었습니다.`);
        }
      }

      clearCart();
      if (!isAuthenticated) {
        toast.success(`주문번호 ${orderNumber} 로 접수되었습니다. 진행 상황은 주문번호로 확인하실 수 있어요.`, {
          duration: 6000,
        });
      } else {
        toast.success("주문이 완료되었습니다!");
      }
      router.push(`/order/${orderNumber}`);
    } catch (error) {
      console.error("주문 에러:", error);
      toast.error("주문 처리 중 오류가 발생했습니다");
    } finally {
      setIsOrdering(false);
    }
  };

  // 수량 할인 금액 계산
  const totalDiscount = items.reduce((sum, item) => {
    const base = item.basePrice || item.unitPrice;
    return sum + (base - item.unitPrice) * item.quantity;
  }, 0);

  // 크루 할인 계산 — 관리자 승인(discount_status='approved') 시에만 적용
  const isCrewMember = profile?.discount_status === "approved";
  const subtotal = getTotalPrice();
  const crewDiscount = getCrewDiscountAmount(subtotal, isCrewMember);
  const finalTotal = subtotal - crewDiscount;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h1 className="text-xl font-bold text-gray-700 mb-2">
            장바구니가 비어있습니다
          </h1>
          <p className="text-gray-500 mb-6">상품을 추가하고 커스텀해보세요!</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              상품 둘러보기
            </Button>
          </Link>
        </div>
        <CustomerSupportLink />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 lg:pb-0">
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* 페이지 제목 */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            쇼핑 계속하기
          </Link>
          <h1 className="text-2xl font-bold">장바구니</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length}개 상품</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 장바구니 아이템 목록 - 플랫 카드 리스트 */}
          <div className="lg:col-span-2 space-y-3">
            {items.map((item) => {
              const isExpanded = expandedItems.has(item.id);
              const hasDesign = item.designLayers.length > 0;
              const layersByView = item.designLayers.reduce(
                (acc, layer) => {
                  if (!acc[layer.view]) acc[layer.view] = [];
                  acc[layer.view].push(layer);
                  return acc;
                },
                {} as Record<string, typeof item.designLayers>
              );
              const hasDiscount =
                item.basePrice && item.unitPrice < item.basePrice;

              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    {/* 메인 정보 영역 */}
                    <div className="flex gap-4">
                      {/* 색상 프리뷰 */}
                      <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 flex items-center justify-center relative overflow-hidden">
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: item.colorHex || "#eee",
                          }}
                        />
                        {hasDesign && (
                          <div className="absolute bottom-0.5 right-0.5 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                            <Layers className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-sm sm:text-base leading-tight">
                              {item.productName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div
                                className="w-3.5 h-3.5 rounded-full ring-1 ring-gray-300"
                                style={{
                                  backgroundColor: item.colorHex || "#000",
                                }}
                              />
                              <span className="text-xs sm:text-sm text-gray-500">
                                {item.colorLabel}
                              </span>
                              <span className="text-xs text-gray-300">|</span>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {item.size}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 수량 + 가격 */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() =>
                                handleQuantityChange(item.id, -1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() =>
                                handleQuantityChange(item.id, 1)
                              }
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="text-right">
                            {hasDiscount && (
                              <p className="text-xs text-gray-400 line-through">
                                {(item.basePrice! * item.quantity).toLocaleString()}원
                              </p>
                            )}
                            <p className="font-bold text-sm sm:text-base">
                              {(item.unitPrice * item.quantity).toLocaleString()}원
                            </p>
                            {hasDiscount && (
                              <p className="text-xs text-orange-600 font-medium">
                                {item.unitPrice.toLocaleString()}원/개
                                <span className="ml-1 text-red-500">
                                  -
                                  {Math.round(
                                    ((item.basePrice! - item.unitPrice) /
                                      item.basePrice!) *
                                      100
                                  )}
                                  %
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 디자인 상세 토글 */}
                    {hasDesign && (
                      <>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          className="w-full mt-3 pt-3 border-t flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {isExpanded ? "디자인 접기" : "디자인 보기"}
                          ({item.designLayers.length}개 레이어)
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div
                          className={`grid transition-all duration-300 ease-out ${
                            isExpanded
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="pt-3 space-y-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs font-medium text-gray-600 mb-2">
                                  커스텀 디자인 위치
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {Object.entries(layersByView).map(
                                    ([view, layers]) => (
                                      <span
                                        key={view}
                                        className="inline-flex items-center gap-1 bg-white border text-xs rounded-md px-2 py-1"
                                      >
                                        {viewLabels[view] || view}
                                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                                          {layers.length}
                                        </span>
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                              <Button
                                onClick={() => handleEditDesign(item)}
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                스튜디오에서 디자인 수정
                              </Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 데스크탑 주문 요약 사이드바 */}
          <div className="hidden lg:block">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>상품 합계</span>
                  <span>{subtotal.toLocaleString()}원</span>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span>대량 구매 할인</span>
                    <span>-{totalDiscount.toLocaleString()}원</span>
                  </div>
                )}
                {crewDiscount > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="w-3.5 h-3.5" />
                      크루 할인 ({getCrewDiscountLabel()})
                    </span>
                    <span>-{crewDiscount.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-green-600">
                  <span>배송비</span>
                  <span>무료</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>총 결제금액</span>
                  <span className="text-blue-600">
                    {finalTotal.toLocaleString()}원
                  </span>
                </div>
                {isCrewMember && (
                  <Badge variant="outline" className="w-full justify-center text-purple-600 border-purple-200 bg-purple-50">
                    <UsersIcon className="w-3 h-3 mr-1" />
                    크루 회원 {getCrewDiscountLabel()} 할인 적용 중
                  </Badge>
                )}
                {!isCrewMember && isAuthenticated && profile?.discount_status === "pending" && (
                  <p className="text-xs text-center text-gray-500">
                    크루 할인 승인 대기 중이에요. 승인되면 {getCrewDiscountLabel()} 할인이 적용돼요.
                  </p>
                )}
                {!isCrewMember && isAuthenticated && profile?.discount_status !== "pending" && (
                  <p className="text-xs text-center text-gray-500">
                    크루로 가입하면 승인 후 {getCrewDiscountLabel()} 할인!
                  </p>
                )}

                {authLoading ? (
                  <Button className="w-full" size="lg" disabled>
                    <Spinner className="mr-2 h-4 w-4" />
                    로딩 중...
                  </Button>
                ) : isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700">
                        <span className="font-medium">{profile?.name}</span>
                        님으로 주문
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleOpenOrderModal}
                      disabled={isLoadingMessages}
                    >
                      {isLoadingMessages ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          로딩 중...
                        </>
                      ) : (
                        "주문하기"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {/* primary CTA: 비회원으로 주문하기 (즉시 진행) */}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleOrderButtonClick}
                      disabled={isLoadingMessages}
                    >
                      {isLoadingMessages ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          로딩 중...
                        </>
                      ) : (
                        "주문하기"
                      )}
                    </Button>
                    <p className="text-[11px] text-center text-gray-500">
                      비회원으로도 주문 가능 · 주문번호로 진행 추적
                    </p>

                    {/* 보조 CTA: 크루 로그인 — 10% 할인 */}
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <UsersIcon className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">
                          크루 로그인 시 10% 할인
                        </span>
                      </div>
                      <CrewLoginInline onSuccess={handleCrewLoginSuccess} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 모바일 하단 주문 요약 바 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">
                총 {items.length}개 상품
                {(totalDiscount > 0 || crewDiscount > 0) && (
                  <span className="text-orange-600 ml-1">
                    (할인 -{(totalDiscount + crewDiscount).toLocaleString()}원)
                  </span>
                )}
              </p>
              <p className="font-bold text-lg text-blue-600">
                {finalTotal.toLocaleString()}원
              </p>
            </div>
            {authLoading ? (
              <Button disabled className="px-8">
                <Spinner className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleOrderButtonClick}
                disabled={isLoadingMessages}
                className="px-8"
              >
                {isLoadingMessages ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  "주문하기"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 주문 모달 */}
      <OrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        adminMessages={adminMessages}
        totalAmount={getGrandTotal()}
        onSubmit={handleOrder}
        isSubmitting={isOrdering}
      />

      {/* 비회원 주문 전 1회 유도 모달 */}
      <GuestIntentModal
        open={guestIntentOpen}
        onOpenChange={setGuestIntentOpen}
        onContinueAsGuest={handleContinueAsGuest}
        onCrewLoginSuccess={handleCrewLoginFromIntent}
      />

      <CustomerSupportLink />
    </div>
  );
}
