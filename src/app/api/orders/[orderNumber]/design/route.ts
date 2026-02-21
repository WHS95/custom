/**
 * 주문 디자인 수정 API
 *
 * PATCH /api/orders/[orderNumber]/design - 디자인 수정 (디자인 확정 전까지만)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import {
  isAllowedPrintColor,
  type PrintColor,
} from "@/lib/constants/print-color-palette";
import { getTenantById } from "@/application/tenant-service";

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

interface DesignLayer {
  id: string;
  type: "image" | "text";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  view: string;
  color?: string;
}

interface ItemUpdate {
  id: string;
  designSnapshot: DesignLayer[];
}

function hasInvalidTextLayerColor(
  items: ItemUpdate[],
  palette?: PrintColor[],
): boolean {
  return items.some((item) =>
    item.designSnapshot?.some(
      (layer) =>
        layer.type === "text" && !isAllowedPrintColor(layer.color, palette),
    ),
  );
}

/**
 * PATCH - 디자인 수정
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = await params;
    const body = await request.json();

    const supabase = createServerSupabaseClient();

    // 1. 주문 조회
    const { data: order, error: orderError } = (await supabase
      .from("orders")
      .select("id, status, tenant_id")
      .eq("order_number", orderNumber)
      .single()) as {
      data: { id: string; status: string; tenant_id: string } | null;
      error: unknown;
    };

    if (orderError || !order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 2. 디자인 확정 전인지 확인
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "디자인이 확정되어 수정할 수 없습니다." },
        { status: 403 },
      );
    }

    // 3. 아이템별 디자인 업데이트
    const items: ItemUpdate[] = body.items || [];
    const tenant = await getTenantById(order.tenant_id);
    const palette = tenant?.settings?.printColorPalette;

    if (hasInvalidTextLayerColor(items, palette)) {
      return NextResponse.json(
        { error: "텍스트 색상은 지정된 인쇄 가능 색상만 선택할 수 있습니다." },
        { status: 400 },
      );
    }

    for (const item of items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("order_items")
        .update({
          design_snapshot: item.designSnapshot,
        })
        .eq("id", item.id)
        .eq("order_id", order.id);

      if (updateError) {
        console.error("아이템 업데이트 에러:", updateError);
        throw new Error(`아이템 업데이트 실패: ${updateError.message}`);
      }
    }

    // 4. 주문 updated_at 갱신
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("orders")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return NextResponse.json({
      success: true,
      message: "디자인이 저장되었습니다.",
    });
  } catch (error) {
    console.error("디자인 수정 에러:", error);
    return NextResponse.json(
      { error: "디자인 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
