/**
 * 주문 API 라우트
 *
 * POST /api/orders - 주문 생성
 * GET /api/orders - 주문 목록 조회
 */

import { NextRequest, NextResponse } from "next/server";
import {
  createOrder,
  getOrdersByPhone,
  getOrdersByUserId,
  getOrdersForAdmin,
  DEFAULT_TENANT_ID,
} from "@/application/order-service";
import { getTenantById } from "@/application/tenant-service";
import type { CreateOrderDTO, ShippingInfo } from "@/domain/order";
import { notifyNewOrder } from "@/lib/slack";
import {
  isAllowedPrintColor,
  type PrintColor,
} from "@/lib/constants/print-color-palette";
import { getCrewDiscountAmount } from "@/lib/pricing/crew-discount";
import { getSupabaseServerClient } from "@/infrastructure/supabase/server";

function hasInvalidTextLayerColor(
  items: unknown,
  palette?: PrintColor[],
): boolean {
  if (!Array.isArray(items)) return false;

  return items.some((item) => {
    const layers = (item as Record<string, unknown>)?.designLayers;
    if (!Array.isArray(layers)) return false;

    return layers.some((layer) => {
      const layerObj = layer as Record<string, unknown>;
      if (layerObj?.type !== "text") return false;
      return !isAllowedPrintColor(layerObj?.color, palette);
    });
  });
}

/**
 * POST - 주문 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 유효성 검사
    if (
      !body.customerName ||
      !body.customerPhone ||
      !body.shippingInfo ||
      !body.items?.length
    ) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 },
      );
    }

    // 배송 정보 유효성 검사
    const shippingInfo: ShippingInfo = body.shippingInfo;
    if (
      !shippingInfo.recipientName ||
      !shippingInfo.phone ||
      !shippingInfo.address
    ) {
      return NextResponse.json(
        { error: "배송 정보가 올바르지 않습니다." },
        { status: 400 },
      );
    }

    const tenantId = body.tenantId || DEFAULT_TENANT_ID;
    const tenant = await getTenantById(tenantId);
    const palette = tenant?.settings?.printColorPalette;

    // 텍스트 색상은 테넌트의 인쇄 허용 팔레트 내에서만 주문 가능
    if (hasInvalidTextLayerColor(body.items, palette)) {
      return NextResponse.json(
        { error: "텍스트 색상은 지정된 인쇄 가능 색상만 선택할 수 있습니다." },
        { status: 400 },
      );
    }

    // 크루 회원 할인 확인
    let isCrewMember = false;
    if (body.userId) {
      try {
        const supabase = await getSupabaseServerClient();
        const { data: profile } = await supabase
          .schema("runhousecustom")
          .from("user_profiles")
          .select("user_type")
          .eq("user_id", body.userId)
          .maybeSingle();
        isCrewMember = profile?.user_type === "crew_staff";
      } catch (err) {
        console.error("크루 회원 확인 에러:", err);
      }
    }

    // 크루 할인 적용된 아이템 가격 계산
    let orderItems = body.items;
    if (isCrewMember) {
      const subtotal = orderItems.reduce(
        (sum: number, item: { unitPrice: number; quantity: number }) =>
          sum + item.unitPrice * item.quantity,
        0,
      );
      const crewDiscount = getCrewDiscountAmount(subtotal, true);
      if (crewDiscount > 0) {
        // 각 아이템에 비례적으로 할인 분배
        const discountRate = crewDiscount / subtotal;
        orderItems = orderItems.map(
          (item: { unitPrice: number; [key: string]: unknown }) => ({
            ...item,
            unitPrice: Math.floor(item.unitPrice * (1 - discountRate)),
          }),
        );
      }
    }

    const dto: CreateOrderDTO = {
      tenantId,
      userId: body.userId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerEmail: body.customerEmail,
      shippingInfo: shippingInfo,
      items: orderItems,
    };

    const order = await createOrder(dto);

    // 슬랙 알림 발송 (비동기, 실패해도 주문 처리에 영향 없음)
    notifyNewOrder(
      order.orderNumber,
      order.customerName,
      order.totalAmount,
      order.items.length,
      shippingInfo.organizationName,
    ).catch((err) => console.error("[Slack] 신규 주문 알림 실패:", err));

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("주문 생성 에러:", error);
    return NextResponse.json(
      { error: "주문 생성에 실패했습니다." },
      { status: 500 },
    );
  }
}

/**
 * GET - 주문 목록 조회
 *
 * Query params:
 * - phone: 고객 전화번호 (고객용)
 * - userId: 로그인 사용자 ID (회원용)
 * - admin: true (관리자용 전체 조회)
 * - status: 주문 상태 필터
 * - detail: true (아이템 상세 포함)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const userId = searchParams.get("userId");
    const isAdmin = searchParams.get("admin") === "true";
    const status = searchParams.get("status");
    const detail = searchParams.get("detail") === "true";

    if (isAdmin) {
      // 페이지네이션 파라미터
      const page = parseInt(searchParams.get("page") || "1");
      const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

      // 관리자용 전체 조회
      const orders = await getOrdersForAdmin({
        status: status as
          | "pending"
          | "design_confirmed"
          | "preparing"
          | "in_production"
          | "shipped"
          | "delivered"
          | "cancelled"
          | undefined,
        page,
        limit,
      });

      return NextResponse.json({
        success: true,
        page,
        limit,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          shippingInfo: order.shippingInfo,
          items: order.items,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          totalAmount: order.totalAmount,
          status: order.status,
          adminMemo: order.adminMemo,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
        })),
      });
    }

    // 로그인 회원용 조회
    if (userId) {
      const orders = await getOrdersByUserId(userId);

      return NextResponse.json({
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
          createdAt: order.createdAt,
          ...(detail && {
            items: order.items.map((item) => ({
              productName: item.productName,
              colorLabel: item.colorLabel,
              size: item.size,
              quantity: item.quantity,
            })),
          }),
        })),
      });
    }

    if (phone) {
      // 고객용 전화번호 조회
      const orders = await getOrdersByPhone(phone);

      return NextResponse.json({
        success: true,
        orders: orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          itemCount: order.items.length,
          createdAt: order.createdAt,
        })),
      });
    }

    return NextResponse.json(
      { error: "전화번호 또는 사용자 ID를 입력해주세요." },
      { status: 400 },
    );
  } catch (error) {
    console.error("주문 조회 에러:", error);
    return NextResponse.json(
      { error: "주문 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}
