"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ListOrdered, Wrench } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  useStudioConfig,
  HatView,
  ProductColor,
} from "@/lib/store/studio-context";
import {
  type OrderStatus,
  type AttachmentFile,
} from "@/domain/order";
import {
  HatDesignCanvas,
  DesignLayer,
  getDefaultLayerPosition,
} from "@/components/shared/HatDesignCanvas";
import OrderItemsSidebar from "@/components/order/OrderItemsSidebar";
import OrderToolsPanel from "@/components/order/OrderToolsPanel";
import OrderHeader from "@/components/order/OrderHeader";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  color: string;
  colorLabel: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  designSnapshot: DesignLayer[];
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingInfo: {
    recipientName: string;
    phone: string;
    address: string;
    addressDetail?: string;
    organizationName?: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  status: OrderStatus;
  attachmentFiles?: AttachmentFile[];
  createdAt: string;
}

const VIEWS: { id: HatView; label: string }[] = [
  { id: "front", label: "정면" },
  { id: "back", label: "후면" },
  { id: "left", label: "좌측" },
  { id: "right", label: "우측" },
  { id: "top", label: "상단" },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.orderNumber as string;

  const { config } = useStudioConfig();

  // 주문 데이터
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [payment, setPayment] = useState<{
    paymentLink: string | null;
    paymentStatus: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 상품별 색상 이미지 (productId -> ProductColor[])
  const [productColorsMap, setProductColorsMap] = useState<
    Record<string, ProductColor[]>
  >({});

  // 상품+색상별 인쇄 영역 (productId-colorId -> safeZones)
  const [productSafeZonesMap, setProductSafeZonesMap] = useState<
    Record<
      string,
      Partial<
        Record<HatView, { x: number; y: number; width: number; height: number }>
      >
    >
  >({});

  // 현재 선택된 아이템
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);

  // 펼쳐진 아이템 (디자인 상세 보기)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // 모바일 Sheet 상태
  const [mobileItemsOpen, setMobileItemsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // 디자인 편집 상태
  const [editedLayers, setEditedLayers] = useState<
    Record<string, DesignLayer[]>
  >({});
  const [hasChanges, setHasChanges] = useState(false);

  // 캔버스 상태
  const [currentView, setCurrentView] = useState<HatView>("front");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // 현재 선택된 아이템
  const currentItem = order?.items[selectedItemIndex];

  // 현재 아이템의 레이어 (수정된 것 우선)
  const currentLayers = currentItem
    ? editedLayers[currentItem.id] || currentItem.designSnapshot || []
    : [];

  // 현재 뷰의 레이어만 필터링
  const viewLayers = currentLayers.filter((l) => l.view === currentView);

  // 수정 가능 여부 (디자인 확정 전까지만)
  const canEdit = order?.status === "pending";

  // 선택된 레이어
  const selectedLayer = currentLayers.find((l) => l.id === selectedLayerId);

  // 결제 정보 (그로블 결제 링크)
  useEffect(() => {
    fetch(`/api/orders/${orderNumber}/payment`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setPayment(json.data);
      })
      .catch(() => {
        // 결제 정보는 부가 기능 — 실패해도 주문 페이지는 동작
      });
  }, [orderNumber]);

  // 주문 데이터 로드
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/orders/${orderNumber}`);
        const data = await response.json();

        if (data.success) {
          setOrder(data.order);
          // 디자인이 있는 첫 번째 뷰로 이동
          const firstItem = data.order.items[0];
          if (firstItem?.designSnapshot?.length > 0) {
            setCurrentView(firstItem.designSnapshot[0].view);
          }

          // 상품별 색상 이미지 및 인쇄 영역 불러오기
          const uniqueProductColorPairs = data.order.items.map(
            (item: OrderItem) => ({
              productId: item.productId,
              colorId: item.color,
            }),
          );
          // 중복 제거
          const uniquePairs = uniqueProductColorPairs.filter(
            (
              pair: { productId: string; colorId: string },
              index: number,
              self: { productId: string; colorId: string }[],
            ) =>
              index ===
              self.findIndex(
                (p) =>
                  p.productId === pair.productId && p.colorId === pair.colorId,
              ),
          );

          const colorsMap: Record<string, ProductColor[]> = {};
          const safeZonesMap: Record<
            string,
            Partial<
              Record<
                HatView,
                { x: number; y: number; width: number; height: number }
              >
            >
          > = {};

          // 고유 상품 ID 추출 후 상품 정보 병렬 fetch
          const uniqueProductIds = [...new Set(uniquePairs.map((p: { productId: string; colorId: string }) => p.productId))];
          const productResults = await Promise.all(
            uniqueProductIds.map(async (productId) => {
              try {
                const productRes = await fetch(`/api/products/${productId}`);
                const productData = await productRes.json();
                return { productId, productData };
              } catch (err) {
                console.error(`상품 ${productId} 정보 로드 실패:`, err);
                return { productId, productData: null };
              }
            }),
          );

          // 상품 정보 매핑
          for (const { productId, productData } of productResults) {
            if (productData?.success && productData.data) {
              const product = productData.data;
              const colors: ProductColor[] = (product.variants || []).map(
                (variant: { id: string; label: string; hex: string }) => {
                  const views: Record<HatView, string> = {
                    front: "",
                    back: "",
                    left: "",
                    right: "",
                    top: "",
                  };
                  (product.images || []).forEach(
                    (img: {
                      colorId: string;
                      view: string;
                      url: string;
                    }) => {
                      if (img.colorId === variant.id) {
                        views[img.view as HatView] = img.url;
                      }
                    },
                  );
                  return {
                    id: variant.id,
                    label: variant.label,
                    hex: variant.hex,
                    views,
                  };
                },
              );
              colorsMap[productId as string] = colors;
            }
          }

          // 인쇄 영역 병렬 fetch
          const areasResults = await Promise.all(
            uniquePairs.map(async ({ productId, colorId }: { productId: string; colorId: string }) => {
              try {
                const areasRes = await fetch(
                  `/api/products/${productId}/areas?colorId=${colorId}`,
                );
                const areasData = await areasRes.json();
                return { productId, colorId, areasData };
              } catch (err) {
                console.error(`상품 ${productId} 영역 로드 실패:`, err);
                return { productId, colorId, areasData: null };
              }
            }),
          );

          // 인쇄 영역 매핑
          for (const { productId, colorId, areasData } of areasResults) {
            if (areasData?.success && areasData.data) {
              const zones: Partial<
                Record<
                  HatView,
                  { x: number; y: number; width: number; height: number }
                >
              > = {};

              // 먼저 공통 영역(colorId가 null) 추가
              areasData.data.forEach(
                (area: {
                  viewName: string;
                  colorId: string | null;
                  zoneX: number;
                  zoneY: number;
                  zoneWidth: number;
                  zoneHeight: number;
                  isEnabled: boolean;
                }) => {
                  if (area.isEnabled && !area.colorId) {
                    zones[area.viewName as HatView] = {
                      x: area.zoneX,
                      y: area.zoneY,
                      width: area.zoneWidth,
                      height: area.zoneHeight,
                    };
                  }
                },
              );

              // 색상별 영역으로 덮어씀 (우선순위 높음)
              areasData.data.forEach(
                (area: {
                  viewName: string;
                  colorId: string | null;
                  zoneX: number;
                  zoneY: number;
                  zoneWidth: number;
                  zoneHeight: number;
                  isEnabled: boolean;
                }) => {
                  if (area.isEnabled && area.colorId === colorId) {
                    zones[area.viewName as HatView] = {
                      x: area.zoneX,
                      y: area.zoneY,
                      width: area.zoneWidth,
                      height: area.zoneHeight,
                    };
                  }
                },
              );

              const mapKey = `${productId}-${colorId}`;
              safeZonesMap[mapKey] = zones;
            }
          }

          setProductColorsMap(colorsMap);
          setProductSafeZonesMap(safeZonesMap);
        } else {
          toast.error("주문을 찾을 수 없습니다.");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("주문 조회 에러:", error);
        toast.error("주문 조회에 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, router]);

  // 아이템 변경 시 해당 아이템의 디자인이 있는 뷰로 이동
  useEffect(() => {
    if (currentItem) {
      const layers =
        editedLayers[currentItem.id] || currentItem.designSnapshot || [];
      if (layers.length > 0) {
        setCurrentView(layers[0].view);
      }
      setSelectedLayerId(null);
    }
  }, [selectedItemIndex, currentItem?.id]);

  // 레이어 업데이트
  const handleLayerUpdate = (
    layerId: string,
    updates: Partial<DesignLayer>,
  ) => {
    if (!canEdit || !currentItem) return;

    const currentItemLayers =
      editedLayers[currentItem.id] || currentItem.designSnapshot || [];
    const updatedLayers = currentItemLayers.map((layer) =>
      layer.id === layerId ? { ...layer, ...updates } : layer,
    );

    setEditedLayers((prev) => ({
      ...prev,
      [currentItem.id]: updatedLayers,
    }));
    setHasChanges(true);
  };

  // 레이어 삭제
  const handleLayerRemove = (layerId: string) => {
    if (!canEdit || !currentItem) return;

    const currentItemLayers =
      editedLayers[currentItem.id] || currentItem.designSnapshot || [];
    const updatedLayers = currentItemLayers.filter(
      (layer) => layer.id !== layerId,
    );

    setEditedLayers((prev) => ({
      ...prev,
      [currentItem.id]: updatedLayers,
    }));
    setSelectedLayerId(null);
    setHasChanges(true);
  };

  // 레이어 회전
  const handleRotate = (degrees: number) => {
    if (!selectedLayerId || !selectedLayer) return;
    handleLayerUpdate(selectedLayerId, {
      rotation: (selectedLayer.rotation + degrees + 360) % 360,
    });
  };

  // 레이어 반전
  const handleFlip = (axis: "x" | "y") => {
    if (!selectedLayerId || !selectedLayer) return;
    handleLayerUpdate(selectedLayerId, {
      [axis === "x" ? "flipX" : "flipY"]:
        axis === "x" ? !selectedLayer.flipX : !selectedLayer.flipY,
    });
  };

  // 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit || !currentItem) return;

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const defaultPos = getDefaultLayerPosition(currentView, config);

      const newLayer: DesignLayer = {
        id: `layer_${Date.now()}`,
        type: "image",
        content,
        ...defaultPos,
        rotation: 0,
        flipX: false,
        flipY: false,
        view: currentView,
      };

      const currentItemLayers =
        editedLayers[currentItem.id] || currentItem.designSnapshot || [];
      setEditedLayers((prev) => ({
        ...prev,
        [currentItem.id]: [...currentItemLayers, newLayer],
      }));
      setSelectedLayerId(newLayer.id);
      setHasChanges(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // 이미지 다운로드 함수
  const handleDownloadImage = async (layer: DesignLayer, index: number) => {
    try {
      const content = layer.content;
      let blob: Blob;

      if (content.startsWith("data:")) {
        // Base64 이미지 처리
        const base64Data = content.split(",")[1];
        const mimeType = content.split(";")[0].split(":")[1] || "image/png";
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: mimeType });
      } else {
        // URL 이미지 처리
        const response = await fetch(content);
        blob = await response.blob();
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = blob.type.split("/")[1] || "png";
      a.download = `${order?.orderNumber}_${layer.view}_design_${index + 1}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("이미지가 다운로드되었습니다");
    } catch (error) {
      console.error("다운로드 에러:", error);
      toast.error("이미지 다운로드에 실패했습니다");
    }
  };

  // 모든 디자인 이미지 다운로드
  const handleDownloadAllImages = async () => {
    if (!order) return;

    const imageLayers = order.items.flatMap((item, itemIdx) =>
      (editedLayers[item.id] || item.designSnapshot || [])
        .filter((layer) => layer.type === "image")
        .map((layer, layerIdx) => ({
          layer,
          itemIndex: itemIdx,
          layerIndex: layerIdx,
          colorLabel: item.colorLabel,
        })),
    );

    if (imageLayers.length === 0) {
      toast.info("다운로드할 디자인 이미지가 없습니다");
      return;
    }

    toast.info(`${imageLayers.length}개 이미지 다운로드 중...`);

    for (let i = 0; i < imageLayers.length; i++) {
      const { layer, colorLabel, layerIndex } = imageLayers[i];
      try {
        const content = layer.content;
        let blob: Blob;

        if (content.startsWith("data:")) {
          const base64Data = content.split(",")[1];
          const mimeType = content.split(";")[0].split(":")[1] || "image/png";
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: mimeType });
        } else {
          const response = await fetch(content);
          blob = await response.blob();
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = blob.type.split("/")[1] || "png";
        a.download = `${order.orderNumber}_${colorLabel}_${layer.view}_${layerIndex + 1}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 다운로드 간 딜레이
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("다운로드 에러:", error);
      }
    }

    toast.success("모든 이미지 다운로드 완료");
  };

  // 주문자 첨부파일 다운로드
  const handleDownloadAttachments = async () => {
    if (!order?.attachmentFiles || order.attachmentFiles.length === 0) {
      toast.info("다운로드할 첨부파일이 없습니다");
      return;
    }

    toast.info(`${order.attachmentFiles.length}개 첨부파일 다운로드 중...`);

    for (const file of order.attachmentFiles) {
      try {
        const response = await fetch(file.url);
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 다운로드 간 딜레이
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error("첨부파일 다운로드 에러:", error);
        toast.error(`${file.name} 다운로드 실패`);
      }
    }

    toast.success("첨부파일 다운로드 완료");
  };

  // 디자인 저장
  const handleSave = async () => {
    if (!hasChanges || !order) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/orders/${orderNumber}/design`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: order.items.map((item) => ({
            id: item.id,
            designSnapshot: editedLayers[item.id] || item.designSnapshot,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("디자인이 저장되었습니다.");
        setHasChanges(false);
        // 주문 데이터 새로고침
        const refreshResponse = await fetch(`/api/orders/${orderNumber}`);
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setOrder(refreshData.order);
          setEditedLayers({});
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("저장 에러:", error);
      toast.error("디자인 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Skeleton className="w-24 h-8 rounded" />
              <div>
                <Skeleton className="w-32 h-5 rounded" />
                <Skeleton className="w-20 h-4 rounded mt-1" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex h-[calc(100vh-64px)]">
          <div className="hidden lg:block w-80 bg-white border-r p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-24 rounded-xl" />
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="w-full max-w-[500px] aspect-square rounded-xl mx-8" />
          </div>
          <div className="hidden lg:block w-72 bg-white border-l p-4 space-y-4">
            <Skeleton className="w-full h-10 rounded" />
            <Skeleton className="w-full h-10 rounded" />
            <Skeleton className="w-full h-32 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Package className='w-12 h-12 mx-auto text-gray-300 mb-4' />
          <p className='text-gray-500'>주문을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const handleSelectItem = (index: number) => {
    setSelectedItemIndex(index);
    setMobileItemsOpen(false);
  };

  const handleToggleExpand = (itemId: string) => {
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

  const sidebarProps = {
    order,
    editedLayers,
    selectedItemIndex,
    expandedItems,
    onSelectItem: handleSelectItem,
    onToggleExpand: handleToggleExpand,
  };

  const toolsPanelProps = {
    canEdit,
    hasChanges,
    saving,
    viewLayers,
    selectedLayerId,
    selectedLayer,
    hasAttachments: !!(order.attachmentFiles && order.attachmentFiles.length > 0),
    attachmentCount: order.attachmentFiles?.length || 0,
    onSave: handleSave,
    onImageUpload: handleImageUpload,
    onRotate: handleRotate,
    onFlip: handleFlip,
    onLayerRemove: handleLayerRemove,
    onLayerSelect: setSelectedLayerId,
    onDownloadAllImages: handleDownloadAllImages,
    onDownloadAttachments: handleDownloadAttachments,
    onDownloadImage: handleDownloadImage,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 상단 헤더 */}
      <OrderHeader
        orderNumber={order.orderNumber}
        customerName={order.customerName}
        organizationName={order.shippingInfo.organizationName}
        status={order.status}
        canEdit={canEdit}
        paymentLink={payment?.paymentLink}
        paymentStatus={payment?.paymentStatus}
      />

      {/* 메인 레이아웃 */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* 좌측 사이드바 - 데스크탑만 */}
        <div className="hidden lg:block w-80 bg-white border-r overflow-y-auto">
          <OrderItemsSidebar {...sidebarProps} />
        </div>

        {/* 중앙: 캔버스 */}
        <div className="flex-1 flex flex-col">
          {/* 뷰 선택 탭 */}
          <div className="bg-white border-b px-2 sm:px-4 py-2 overflow-x-auto">
            <Tabs
              value={currentView}
              onValueChange={(v) => setCurrentView(v as HatView)}
            >
              <TabsList>
                {VIEWS.map((view) => {
                  const hasDesignInView = currentLayers.some(
                    (l) => l.view === view.id,
                  );
                  return (
                    <TabsTrigger
                      key={view.id}
                      value={view.id}
                      className="relative text-xs sm:text-sm"
                    >
                      {view.label}
                      {hasDesignInView && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          {/* 캔버스 영역 */}
          <div className="flex-1 flex items-center justify-center p-4 sm:p-8 bg-gray-100">
            <div className="w-full max-w-[600px]">
              <HatDesignCanvas
                hatColor={currentItem?.color || "black"}
                currentView={currentView}
                layers={currentLayers}
                editable={canEdit}
                onLayerUpdate={handleLayerUpdate}
                onLayerRemove={handleLayerRemove}
                onLayerSelect={setSelectedLayerId}
                selectedLayerId={selectedLayerId}
                showSafeZone={true}
                className="w-full rounded-xl shadow-lg bg-white"
                productColors={
                  currentItem?.productId
                    ? productColorsMap[currentItem.productId]
                    : undefined
                }
                productSafeZones={
                  currentItem?.productId && currentItem?.color
                    ? productSafeZonesMap[
                        `${currentItem.productId}-${currentItem.color}`
                      ]
                    : undefined
                }
              />
            </div>
          </div>

          {/* 모바일 하단 플로팅 버튼들 */}
          <div className="lg:hidden flex gap-2 p-3 bg-white border-t">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setMobileItemsOpen(true)}
            >
              <ListOrdered className="w-4 h-4 mr-2" />
              주문 내역 ({order.items.length})
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setMobileToolsOpen(true)}
            >
              <Wrench className="w-4 h-4 mr-2" />
              도구
            </Button>
          </div>
        </div>

        {/* 우측 도구 패널 - 데스크탑만 */}
        <div className="hidden lg:block w-72 bg-white border-l overflow-y-auto">
          <OrderToolsPanel {...toolsPanelProps} />
        </div>
      </div>

      {/* 모바일 Sheet: 주문 아이템 */}
      <Sheet open={mobileItemsOpen} onOpenChange={setMobileItemsOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>주문 내역</SheetTitle>
          </SheetHeader>
          <OrderItemsSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* 모바일 Sheet: 도구 */}
      <Sheet open={mobileToolsOpen} onOpenChange={setMobileToolsOpen}>
        <SheetContent side="right" className="w-[85vw] max-w-sm p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-0">
            <SheetTitle>도구</SheetTitle>
          </SheetHeader>
          <OrderToolsPanel {...toolsPanelProps} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
