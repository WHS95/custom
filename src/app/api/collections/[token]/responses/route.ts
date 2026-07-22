/**
 * 사이즈 취합 제출 API
 * POST: 크루원 사이즈 제출 (공개)
 * PATCH: 제출 수정 — 본인(editToken) 또는 운영진(adminToken, 입금 체크)
 * DELETE: 제출 삭제 — 본인(editToken) 또는 운영진(adminToken)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import {
  findCollectionByToken,
  getAllowedColors,
  type SizeCollectionRow,
} from "@/lib/collections";

interface Params {
  params: Promise<{ token: string }>;
}

function collectionAcceptsResponses(collection: SizeCollectionRow): string | null {
  if (collection.status !== "open") {
    return "마감된 취합입니다.";
  }
  if (collection.deadline && new Date(collection.deadline) < new Date()) {
    return "제출 기한이 지났습니다.";
  }
  return null;
}

async function validateSelection(
  collection: SizeCollectionRow,
  colorId: string | undefined,
  size: string,
): Promise<string | null> {
  if (!collection.product_id) return null;
  const product = await getProductById(collection.product_id);
  if (!product) return null;

  const allowedColors = getAllowedColors(collection);
  const variants = product.variants.filter((v) =>
    // 확정 디자인이 있으면 해당 색상으로 고정
    collection.design_color_id
      ? v.id === collection.design_color_id
      : allowedColors.length === 0 || allowedColors.includes(v.id),
  );

  if (variants.length > 0) {
    const variant = variants.find((v) => v.id === colorId);
    if (!variant) return "색상을 선택해주세요.";
    if (!variant.sizes.includes(size)) return "사이즈가 올바르지 않습니다.";
  }
  return null;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, colorId, size, quantity, note } = body as {
      name?: string;
      colorId?: string;
      size?: string;
      quantity?: number;
      note?: string;
    };

    if (!name?.trim() || !size) {
      return NextResponse.json(
        { error: "이름과 사이즈를 입력해주세요." },
        { status: 400 },
      );
    }
    const qty = quantity ?? 1;
    if (!Number.isInteger(qty) || qty < 1 || qty > 20) {
      return NextResponse.json(
        { error: "수량은 1~20 사이여야 합니다." },
        { status: 400 },
      );
    }

    const collection = await findCollectionByToken(token);
    if (!collection) {
      return NextResponse.json(
        { error: "취합을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const closedReason = collectionAcceptsResponses(collection);
    if (closedReason) {
      return NextResponse.json({ error: closedReason }, { status: 400 });
    }

    const selectionError = await validateSelection(collection, colorId, size);
    if (selectionError) {
      return NextResponse.json({ error: selectionError }, { status: 400 });
    }

    const editToken = randomBytes(12).toString("base64url");
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("size_collection_responses")
      .insert({
        collection_id: collection.id,
        name: name.trim().slice(0, 100),
        color_id: colorId || null,
        size,
        quantity: qty,
        note: note?.trim().slice(0, 500) || null,
        edit_token: editToken,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id, editToken },
    });
  } catch (error) {
    console.error("POST /api/collections/[token]/responses error:", error);
    return NextResponse.json(
      { error: "제출에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { responseId, adminToken, editToken, isPaid, name, colorId, size, quantity, note } =
      body as {
        responseId?: string;
        adminToken?: string;
        editToken?: string;
        isPaid?: boolean;
        name?: string;
        colorId?: string;
        size?: string;
        quantity?: number;
        note?: string;
      };

    if (!responseId) {
      return NextResponse.json(
        { error: "responseId가 필요합니다." },
        { status: 400 },
      );
    }

    const collection = await findCollectionByToken(token);
    if (!collection) {
      return NextResponse.json(
        { error: "취합을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: response } = await supabase
      .from("size_collection_responses")
      .select("*")
      .eq("id", responseId)
      .eq("collection_id", collection.id)
      .maybeSingle();

    if (!response) {
      return NextResponse.json(
        { error: "제출을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const isManager = !!adminToken && adminToken === collection.admin_token;
    const isOwner = !!editToken && editToken === response.edit_token;

    const updateData: Record<string, unknown> = {};

    if (isManager) {
      // 운영진: 입금 확인 체크
      if (typeof isPaid === "boolean") updateData.is_paid = isPaid;
    } else if (isOwner) {
      // 본인: 내용 수정 (마감/기한 전에만)
      const closedReason = collectionAcceptsResponses(collection);
      if (closedReason) {
        return NextResponse.json(
          { error: `${closedReason} 수정은 운영진에게 문의해주세요.` },
          { status: 400 },
        );
      }
      if (size !== undefined || colorId !== undefined) {
        const newSize = size ?? response.size;
        const newColor = colorId ?? response.color_id ?? undefined;
        const selectionError = await validateSelection(collection, newColor, newSize);
        if (selectionError) {
          return NextResponse.json({ error: selectionError }, { status: 400 });
        }
        updateData.size = newSize;
        updateData.color_id = newColor || null;
      }
      if (name?.trim()) updateData.name = name.trim().slice(0, 100);
      if (quantity !== undefined) {
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
          return NextResponse.json(
            { error: "수량은 1~20 사이여야 합니다." },
            { status: 400 },
          );
        }
        updateData.quantity = quantity;
      }
      if (note !== undefined) updateData.note = note?.trim().slice(0, 500) || null;
    } else {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "수정할 내용이 없습니다." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("size_collection_responses")
      .update(updateData)
      .eq("id", responseId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/collections/[token]/responses error:", error);
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const responseId = searchParams.get("responseId");
    const adminToken = searchParams.get("adminToken");
    const editToken = searchParams.get("editToken");

    if (!responseId) {
      return NextResponse.json(
        { error: "responseId가 필요합니다." },
        { status: 400 },
      );
    }

    const collection = await findCollectionByToken(token);
    if (!collection) {
      return NextResponse.json(
        { error: "취합을 찾을 수 없습니다." },
        { status: 404 },
      );
    }
    if (collection.status === "ordered") {
      return NextResponse.json(
        { error: "이미 주문으로 전환되어 삭제할 수 없습니다." },
        { status: 400 },
      );
    }

    const supabase = createServerSupabaseClient();
    const { data: response } = await supabase
      .from("size_collection_responses")
      .select("id, edit_token")
      .eq("id", responseId)
      .eq("collection_id", collection.id)
      .maybeSingle();

    if (!response) {
      return NextResponse.json(
        { error: "제출을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const isManager = !!adminToken && adminToken === collection.admin_token;
    const isOwner = !!editToken && editToken === response.edit_token;
    if (!isManager && !isOwner) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 본인 삭제는 마감/기한 전에만 (운영진은 언제든 가능)
    if (!isManager) {
      const closedReason = collectionAcceptsResponses(collection);
      if (closedReason) {
        return NextResponse.json(
          { error: `${closedReason} 취소는 운영진에게 문의해주세요.` },
          { status: 400 },
        );
      }
    }

    const { error } = await supabase
      .from("size_collection_responses")
      .delete()
      .eq("id", responseId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/collections/[token]/responses error:", error);
    return NextResponse.json(
      { error: "삭제에 실패했습니다." },
      { status: 500 },
    );
  }
}
