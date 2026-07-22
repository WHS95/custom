/**
 * 주문 결제 정보 API (그로블 결제 링크)
 * GET: 결제 링크/상태 조회 (주문 페이지용)
 * PATCH: 결제 링크 설정/해제 (관리자 전용)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";

interface RouteParams {
  params: Promise<{ orderNumber: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { orderNumber } = await params;
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("payment_link, payment_status, paid_at")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentLink: data.payment_link,
        paymentStatus: data.payment_status,
        paidAt: data.paid_at,
      },
    });
  } catch (error) {
    console.error("GET /api/orders/[orderNumber]/payment error:", error);
    return NextResponse.json(
      { error: "결제 정보 조회에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const adminSession = await getCurrentAdmin();
    if (!adminSession) {
      return NextResponse.json(
        { error: "관리자 인증이 필요합니다." },
        { status: 401 },
      );
    }

    const { orderNumber } = await params;
    const body = await request.json();
    const { paymentLink, paymentStatus } = body as {
      paymentLink?: string | null;
      paymentStatus?: string;
    };

    const updateData: Record<string, unknown> = {};

    if (paymentLink !== undefined) {
      if (paymentLink !== null) {
        let parsed: URL;
        try {
          parsed = new URL(paymentLink);
        } catch {
          return NextResponse.json(
            { error: "결제 링크 URL이 올바르지 않습니다." },
            { status: 400 },
          );
        }
        if (parsed.protocol !== "https:") {
          return NextResponse.json(
            { error: "결제 링크는 https URL이어야 합니다." },
            { status: 400 },
          );
        }
      }
      updateData.payment_link = paymentLink;
    }

    // 수동 결제 확인/해제 (웹훅 매칭 실패 시 관리자 처리용)
    if (paymentStatus !== undefined) {
      if (!["unpaid", "paid", "refund_requested"].includes(paymentStatus)) {
        return NextResponse.json(
          { error: "결제 상태 값이 올바르지 않습니다." },
          { status: 400 },
        );
      }
      updateData.payment_status = paymentStatus;
      updateData.paid_at = paymentStatus === "paid" ? new Date().toISOString() : null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "수정할 내용이 없습니다." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("order_number", orderNumber)
      .select("payment_link, payment_status, paid_at")
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentLink: data.payment_link,
        paymentStatus: data.payment_status,
        paidAt: data.paid_at,
      },
    });
  } catch (error) {
    console.error("PATCH /api/orders/[orderNumber]/payment error:", error);
    return NextResponse.json(
      { error: "결제 정보 수정에 실패했습니다." },
      { status: 500 },
    );
  }
}
