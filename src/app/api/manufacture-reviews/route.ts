/**
 * 제작 가능 여부 확인 — 요청 생성 / 내 요청 목록
 *
 * POST (crew_staff): 스튜디오 디자인 + 참고 첨부를 공장 심사로 제출
 *   multipart/form-data: productId, colorId, designLayers(JSON), note?, files[]
 *   → manufacture_reviews(pending) 생성 → 공장 채널 Discord 알림
 * GET  (crew_staff): 내 제작 문의 목록 (상태·상품·등록여부)
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";
import { uploadReviewAttachment } from "@/infrastructure/supabase/storage";
import {
  notifyFactoryReviewRequest,
  crewHandleFromEmail,
} from "@/lib/discord-notify";
import type { Json } from "@/infrastructure/supabase/database.types";

const ALLOWED_EXT = [".ai", ".eps", ".pdf", ".psd", ".png", ".jpg", ".jpeg"];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface AttachmentMeta {
  name: string;
  url: string;
  size: number;
}

async function requireCrewStaff() {
  const { user, profile } = await getCurrentAuthState();
  if (!user) return { error: "크루 로그인이 필요합니다.", status: 401 as const };
  if (profile?.user_type !== "crew_staff") {
    return {
      error:
        profile?.user_type === "crew_pending"
          ? "크루 승인 대기 중입니다. 승인 후 이용할 수 있어요."
          : "크루 운영진 계정만 이용할 수 있습니다.",
      status: 403 as const,
    };
  }
  return { user, profile };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireCrewStaff();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, profile } = auth;

    const form = await request.formData();
    const productId = String(form.get("productId") || "");
    const colorId = String(form.get("colorId") || "");
    const note = String(form.get("note") || "").trim().slice(0, 1000);
    let designLayers: unknown;
    try {
      designLayers = JSON.parse(String(form.get("designLayers") || "[]"));
    } catch {
      return NextResponse.json({ error: "디자인 형식 오류" }, { status: 400 });
    }

    if (
      !productId ||
      !colorId ||
      !Array.isArray(designLayers) ||
      designLayers.length === 0
    ) {
      return NextResponse.json(
        { error: "상품·색상·디자인이 필요합니다." },
        { status: 400 },
      );
    }

    const product = await getProductById(productId);
    if (!product || !product.isActive) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }
    const variant = product.variants.find((v) => v.id === colorId);
    if (!variant) {
      return NextResponse.json({ error: "색상이 올바르지 않습니다." }, { status: 400 });
    }

    // 파일 검증
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `첨부는 최대 ${MAX_FILES}개까지 가능합니다.` },
        { status: 400 },
      );
    }
    for (const f of files) {
      const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
      if (!ALLOWED_EXT.includes(ext)) {
        return NextResponse.json(
          { error: `허용되지 않는 파일 형식: ${f.name}` },
          { status: 400 },
        );
      }
      if (f.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `파일이 너무 큽니다(최대 50MB): ${f.name}` },
          { status: 400 },
        );
      }
    }

    const crewName = profile?.crew_name || profile?.name || "우리 크루";
    const reviewToken = randomBytes(18).toString("base64url");
    const supabase = createServerSupabaseClient();

    // 먼저 리뷰 행 생성 (id 확보 후 첨부 업로드)
    const { data: review, error: insertError } = await supabase
      .from("manufacture_reviews")
      .insert({
        tenant_id: DEFAULT_TENANT_ID,
        creator_user_id: user.id,
        crew_name: crewName,
        product_id: productId,
        color_id: colorId,
        design_snapshot: designLayers as Json,
        note: note || null,
        review_token: reviewToken,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    // 첨부 업로드 → attachments 갱신
    const attachments: AttachmentMeta[] = [];
    for (const f of files) {
      const uploaded = await uploadReviewAttachment(f, review.id, f.name, true);
      if (uploaded) {
        attachments.push({ name: f.name, url: uploaded.url, size: uploaded.size });
      }
    }
    if (attachments.length > 0) {
      await supabase
        .from("manufacture_reviews")
        .update({ attachments: attachments as unknown as Json })
        .eq("id", review.id);
    }

    // 공장 채널 Discord 알림 — 운영은 고정 베이스(NEXT_PUBLIC_SITE_URL),
    // 로컬은 요청 origin으로 폴백
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (request.nextUrl.hostname === "localhost"
        ? request.nextUrl.origin
        : "https://runhouse-custom.vercel.app");
    notifyFactoryReviewRequest({
      crewName,
      handle: crewHandleFromEmail(user.email),
      requesterName: profile?.name,
      phone: profile?.phone,
      productName: product.name,
      colorLabel: variant.label,
      attachmentCount: attachments.length,
      note: note || undefined,
      reviewUrl: `${siteUrl}/review/${reviewToken}`,
    }).catch((err) => console.error("[Discord] 공장 알림 실패:", err));

    return NextResponse.json({ success: true, data: { reviewId: review.id } });
  } catch (error) {
    console.error("POST /api/manufacture-reviews error:", error);
    return NextResponse.json({ error: "제작 문의 접수에 실패했습니다." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const auth = await requireCrewStaff();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user } = auth;

    const supabase = createServerSupabaseClient();
    const { data: reviews, error } = await supabase
      .from("manufacture_reviews")
      .select(
        "id, product_id, color_id, design_snapshot, status, factory_comment, note, attachments, reviewed_at, registered_collection_id, created_at",
      )
      .eq("creator_user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // 상품명·색상 라벨 보강 (중복 productId 1회 조회)
    const productIds = [...new Set((reviews || []).map((r) => r.product_id))];
    const productMap = new Map(
      (await Promise.all(productIds.map((id) => getProductById(id))))
        .filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => [p.id, p]),
    );

    const items = (reviews || []).map((r) => {
      const product = productMap.get(r.product_id);
      const variant = product?.variants.find(
        (v: { id: string }) => v.id === r.color_id,
      );
      // 상세 미리보기용 색상 뷰 이미지
      const views = product
        ? Object.fromEntries(
            product.images
              .filter((img: { colorId: string }) => img.colorId === r.color_id)
              .map((img: { view: string; url: string }) => [img.view, img.url]),
          )
        : {};
      return {
        reviewId: r.id,
        productName: product?.name ?? "상품",
        colorLabel: variant?.label ?? r.color_id,
        status: r.status,
        factoryComment: r.factory_comment,
        note: r.note,
        attachmentCount: Array.isArray(r.attachments) ? r.attachments.length : 0,
        reviewedAt: r.reviewed_at,
        registered: !!r.registered_collection_id,
        createdAt: r.created_at,
        designLayers: r.design_snapshot,
        designColor: variant
          ? {
              id: variant.id,
              label: variant.label,
              hex: variant.hex,
              views,
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: { reviews: items } });
  } catch (error) {
    console.error("GET /api/manufacture-reviews error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}
