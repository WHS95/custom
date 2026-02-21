"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart-store";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Pencil,
  Layers,
  LogIn,
  User,
} from "lucide-react";
import { useDesignStore } from "@/lib/store/design-store";
import { OrderFormData } from "@/components/cart/StepOrderForm";
import { OrderModal } from "@/components/cart/OrderModal";
import { CustomerSupportLink } from "@/components/cart/CustomerSupportLink";

interface AdminMessage {
  productId: string;
  productName: string;
  message: string;
}

export default function CartPage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, isAuthenticated } = useAuth();
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const getShippingCost = useCartStore((state) => state.getShippingCost);
  const getGrandTotal = useCartStore((state) => state.getGrandTotal);
  const clearCart = useCartStore((state) => state.clearCart);

  const [isOrdering, setIsOrdering] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 디자인 스토어
  const setLayersForColor = useDesignStore((state) => state.setLayersForColor);
  const setCurrentView = useDesignStore((state) => state.setCurrentView);
  const newSession = useDesignStore((state) => state.newSession);

  // 디자인 수정하기 - 스튜디오로 이동
  const handleEditDesign = (item: (typeof items)[0]) => {
    // 이전 세션 상태가 섞이지 않도록 초기화 후, 장바구니 아이템 디자인을 로드
    newSession();
    setLayersForColor(item.color, item.designLayers);
    const firstLayerView = item.designLayers[0]?.view;
    if (firstLayerView) {
      setCurrentView(firstLayerView);
    }
    // 스튜디오로 이동
    router.push(`/studio/${item.productId}?mode=order&cartItemId=${item.id}`);
    toast.info(`${item.colorLabel} 디자인 수정 모드로 이동합니다`);
  };

  // 아이템 펼침/접힘 토글
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

  // 장바구니 상품들의 관리자 메시지 가져오기
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
          }),
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

  const handleQuantityChange = (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      updateItemQuantity(id, item.quantity + delta);
    }
  };

  const handleOrder = async (
    formData: OrderFormData,
    attachmentFiles: File[],
  ) => {
    // 로그인 체크
    if (!isAuthenticated || !user) {
      toast.error("로그인이 필요합니다.");
      router.push("/login?redirect=/cart");
      return;
    }

    setIsOrdering(true);
    try {
      // 1. 주문 생성 (user_id 포함)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail || user.email,
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

      // 2. 첨부파일이 있으면 업로드
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
          },
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
      toast.success("주문이 완료되었습니다!");
      router.push(`/order/${orderNumber}`);
    } catch (error) {
      console.error("주문 에러:", error);
      toast.error("주문 처리 중 오류가 발생했습니다");
    } finally {
      setIsOrdering(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <ShoppingBag className='h-16 w-16 mx-auto text-gray-300 mb-4' />
          <h1 className='text-xl font-bold text-gray-700 mb-2'>
            장바구니가 비어있습니다
          </h1>
          <p className='text-gray-500 mb-6'>상품을 추가하고 커스텀해보세요!</p>
          <Link href='/'>
            <Button>
              <ArrowLeft className='mr-2 h-4 w-4' />
              상품 둘러보기
            </Button>
          </Link>
        </div>
        <CustomerSupportLink />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm sticky top-0 z-50'>
        <div className='container mx-auto px-4 py-4 flex items-center gap-4'>
          <Link href='/'>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-5 w-5' />
            </Button>
          </Link>
          <div>
            <h1 className='text-xl font-bold'>장바구니</h1>
            <p className='text-sm text-gray-500'>{items.length}개 상품</p>
          </div>
        </div>
      </header>

      <main className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* 장바구니 아이템 목록 - 상품별 > 색상별 2단계 그룹핑 */}
          <div className='lg:col-span-2 space-y-6'>
            {(() => {
              // 1단계: 상품별 그룹핑
              const productGroups: Record<
                string,
                { productName: string; items: typeof items }
              > = {};
              items.forEach((item) => {
                if (!productGroups[item.productId]) {
                  productGroups[item.productId] = {
                    productName: item.productName,
                    items: [],
                  };
                }
                productGroups[item.productId].items.push(item);
              });

              const viewLabels: Record<string, string> = {
                front: "앞면",
                back: "뒷면",
                left: "좌측",
                right: "우측",
                top: "상단",
              };

              return Object.entries(productGroups).map(([productId, group]) => {
                // 2단계: 색상별 그룹핑
                const colorGroups: Record<
                  string,
                  {
                    colorLabel: string;
                    color: string;
                    items: typeof items;
                  }
                > = {};
                group.items.forEach((item) => {
                  if (!colorGroups[item.color]) {
                    colorGroups[item.color] = {
                      colorLabel: item.colorLabel,
                      color: item.color,
                      items: [],
                    };
                  }
                  colorGroups[item.color].items.push(item);
                });

                // 상품별 소계
                const productSubtotal = group.items.reduce(
                  (sum, item) => sum + item.unitPrice * item.quantity,
                  0,
                );

                return (
                  <Card key={productId} className='overflow-hidden'>
                    {/* 상품 헤더 */}
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-base flex justify-between items-center'>
                        <span>{group.productName}</span>
                        <span className='text-sm font-medium text-gray-500'>
                          소계 {productSubtotal.toLocaleString()}원
                        </span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className='pt-0 space-y-4'>
                      {Object.entries(colorGroups).map(
                        ([colorId, colorGroup]) => (
                          <div
                            key={colorId}
                            className='border rounded-lg overflow-hidden'
                          >
                            {/* 색상 그룹 헤더 */}
                            <div className='flex items-center gap-2.5 px-4 py-2.5 bg-gray-50 border-b'>
                              <div
                                className='w-5 h-5 rounded-full border-2 shadow-sm flex-shrink-0'
                                style={{
                                  backgroundColor:
                                    colorGroup.items[0]?.colorHex || "#000",
                                }}
                              />
                              <span className='text-sm font-bold text-gray-800'>
                                {colorGroup.colorLabel}
                              </span>
                              <span className='text-xs text-gray-400 ml-auto'>
                                {colorGroup.items.length}건
                              </span>
                            </div>

                            {/* 해당 색상의 아이템들 */}
                            <div className='divide-y'>
                              {colorGroup.items.map((item) => {
                                const isExpanded = expandedItems.has(item.id);
                                const hasDesign = item.designLayers.length > 0;

                                // 뷰별 레이어 그룹화
                                const layersByView = item.designLayers.reduce(
                                  (acc, layer) => {
                                    if (!acc[layer.view]) acc[layer.view] = [];
                                    acc[layer.view].push(layer);
                                    return acc;
                                  },
                                  {} as Record<
                                    string,
                                    typeof item.designLayers
                                  >,
                                );

                                return (
                                  <div key={item.id} className='p-4'>
                                    {/* 아이템 정보 */}
                                    <div className='flex justify-between items-start'>
                                      <div>
                                        <p className='text-sm text-gray-700'>
                                          사이즈:{" "}
                                          <span className='font-bold'>
                                            {item.size}
                                          </span>
                                        </p>
                                        {hasDesign && (
                                          <span className='inline-flex items-center text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1'>
                                            <Layers className='w-3 h-3 mr-1' />
                                            {item.designLayers.length}개 레이어
                                          </span>
                                        )}
                                      </div>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        className='text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8'
                                        onClick={() => removeItem(item.id)}
                                      >
                                        <Trash2 className='h-4 w-4' />
                                      </Button>
                                    </div>

                                    <div className='flex justify-between items-center mt-3'>
                                      {/* 수량 조절 */}
                                      <div className='flex items-center gap-2'>
                                        <Button
                                          variant='outline'
                                          size='icon'
                                          className='h-8 w-8'
                                          onClick={() =>
                                            handleQuantityChange(item.id, -1)
                                          }
                                        >
                                          <Minus className='h-3 w-3' />
                                        </Button>
                                        <span className='w-8 text-center font-medium'>
                                          {item.quantity}
                                        </span>
                                        <Button
                                          variant='outline'
                                          size='icon'
                                          className='h-8 w-8'
                                          onClick={() =>
                                            handleQuantityChange(item.id, 1)
                                          }
                                        >
                                          <Plus className='h-3 w-3' />
                                        </Button>
                                      </div>

                                      {/* 가격 */}
                                      <div className='text-right'>
                                        {item.basePrice &&
                                        item.unitPrice < item.basePrice ? (
                                          <>
                                            <p className='text-xs text-gray-400 line-through'>
                                              {item.basePrice.toLocaleString()}
                                              원
                                            </p>
                                            <p className='text-xs text-orange-600 font-medium'>
                                              {item.unitPrice.toLocaleString()}
                                              원 x {item.quantity}
                                              <span className='ml-1 text-red-500'>
                                                -
                                                {Math.round(
                                                  ((item.basePrice -
                                                    item.unitPrice) /
                                                    item.basePrice) *
                                                    100,
                                                )}
                                                %
                                              </span>
                                            </p>
                                          </>
                                        ) : (
                                          <p className='text-xs text-gray-500'>
                                            {item.unitPrice.toLocaleString()}원
                                            x {item.quantity}
                                          </p>
                                        )}
                                        <p className='font-bold'>
                                          {(
                                            item.unitPrice * item.quantity
                                          ).toLocaleString()}
                                          원
                                        </p>
                                      </div>
                                    </div>

                                    {/* 디자인 상세 보기 버튼 */}
                                    {hasDesign && (
                                      <button
                                        onClick={() => toggleExpand(item.id)}
                                        className='w-full mt-3 pt-3 border-t flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors'
                                      >
                                        <Eye className='w-4 h-4' />
                                        {isExpanded
                                          ? "디자인 상세 접기"
                                          : "디자인 상세 보기"}
                                        {isExpanded ? (
                                          <ChevronUp className='w-4 h-4' />
                                        ) : (
                                          <ChevronDown className='w-4 h-4' />
                                        )}
                                      </button>
                                    )}

                                    {/* 펼쳐진 디자인 상세 */}
                                    <div
                                      className={`grid transition-all duration-300 ease-out ${
                                        isExpanded
                                          ? "grid-rows-[1fr] opacity-100"
                                          : "grid-rows-[0fr] opacity-0"
                                      }`}
                                    >
                                      <div className='overflow-hidden'>
                                        <div className='pt-4 space-y-4'>
                                          {/* 뷰별 디자인 정보 */}
                                          <div className='bg-gray-50 rounded-lg p-4'>
                                            <p className='text-sm font-medium text-gray-700 mb-3'>
                                              커스텀 디자인 위치
                                            </p>
                                            <div className='flex flex-wrap gap-2'>
                                              {Object.entries(layersByView).map(
                                                ([view, layers]) => (
                                                  <div
                                                    key={view}
                                                    className='flex items-center gap-2 bg-white border rounded-lg px-3 py-2'
                                                  >
                                                    <span className='text-sm font-medium'>
                                                      {viewLabels[view] || view}
                                                    </span>
                                                    <span className='text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full'>
                                                      {layers.length}개
                                                    </span>
                                                  </div>
                                                ),
                                              )}
                                            </div>
                                          </div>

                                          {/* 디자인 수정 버튼 */}
                                          <Button
                                            onClick={() =>
                                              handleEditDesign(item)
                                            }
                                            variant='outline'
                                            className='w-full'
                                          >
                                            <Pencil className='w-4 h-4 mr-2' />
                                            스튜디오에서 디자인 수정하기
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ),
                      )}
                    </CardContent>
                  </Card>
                );
              });
            })()}
          </div>

          {/* 주문 요약 */}
          <div className='space-y-4'>
            <Card className='sticky top-24'>
              <CardHeader>
                <CardTitle>주문 요약</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-between text-sm'>
                  <span>상품 합계</span>
                  <span>{getTotalPrice().toLocaleString()}원</span>
                </div>
                {/* 할인 금액 표시 */}
                {(() => {
                  const totalDiscount = items.reduce((sum, item) => {
                    const base = item.basePrice || item.unitPrice;
                    return sum + (base - item.unitPrice) * item.quantity;
                  }, 0);
                  if (totalDiscount > 0) {
                    return (
                      <div className='flex justify-between text-sm text-orange-600'>
                        <span>대량 구매 할인</span>
                        <span>-{totalDiscount.toLocaleString()}원</span>
                      </div>
                    );
                  }
                  return null;
                })()}
                <div className='flex justify-between text-sm'>
                  <span>배송비</span>
                  <span>
                    {getShippingCost() === 0
                      ? "무료"
                      : `${getShippingCost().toLocaleString()}원`}
                  </span>
                </div>
                {getShippingCost() > 0 && (
                  <p className='text-xs text-gray-500'>
                    {(50000 - getTotalPrice()).toLocaleString()}원 추가 시
                    무료배송
                  </p>
                )}
                <Separator />
                <div className='flex justify-between font-bold text-lg'>
                  <span>총 결제금액</span>
                  <span className='text-blue-600'>
                    {getGrandTotal().toLocaleString()}원
                  </span>
                </div>

                {/* 로그인 상태에 따른 UI */}
                {authLoading ? (
                  <Button className='w-full' size='lg' disabled>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    로딩 중...
                  </Button>
                ) : isAuthenticated ? (
                  <>
                    {/* 로그인 사용자 정보 */}
                    <div className='flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm'>
                      <User className='w-4 h-4 text-blue-600' />
                      <span className='text-blue-700'>
                        <span className='font-medium'>{profile?.name}</span>
                        님으로 주문
                      </span>
                    </div>
                    <Button
                      className='w-full'
                      size='lg'
                      onClick={() => setOrderModalOpen(true)}
                      disabled={isLoadingMessages}
                    >
                      {isLoadingMessages ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          로딩 중...
                        </>
                      ) : (
                        "주문하기"
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {/* 비로그인 시 로그인 유도 */}
                    <div className='p-4 bg-gray-100 rounded-lg text-center'>
                      <LogIn className='w-8 h-8 mx-auto text-gray-400 mb-2' />
                      <p className='text-sm text-gray-600 mb-3'>
                        주문하려면 로그인이 필요합니다
                      </p>
                      <Link href='/login?redirect=/cart'>
                        <Button className='w-full'>로그인하기</Button>
                      </Link>
                      <p className='text-xs text-gray-500 mt-2'>
                        아직 회원이 아니신가요?{" "}
                        <Link
                          href='/signup'
                          className='text-blue-600 hover:underline'
                        >
                          회원가입
                        </Link>
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 주문 모달 */}
      <OrderModal
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        adminMessages={adminMessages}
        totalAmount={getGrandTotal()}
        onSubmit={handleOrder}
        isSubmitting={isOrdering}
      />

      {/* 고객 문의 링크 */}
      <CustomerSupportLink />
    </div>
  );
}
