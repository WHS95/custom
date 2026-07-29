/**
 * 크루원 디자인 제안 API (공개 — 비로그인 크루원)
 *
 * POST /api/store/[storeToken]/proposals
 *   multipart/form-data: productId, colorId, designLayers(JSON), proposerName,
 *                        proposerContact?, note?, files[]
 *   → design_proposals(pending) 생성. 운영진이 상점 관리 '제안함'에서 채택/반려.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import { uploadReviewAttachment } from "@/infrastructure/supabase/storage";
import { getCurrentAuthState } from "@/lib/auth/server-auth";
import { notifyFactoryReviewRequest } from "@/lib/discord-notify";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { DesignLayer } from "@/components/shared/HatDesignCanvas";

/** 상점 소유 운영진 확인 */
async function requireStoreOwner(storeToken: string) {
  const { user, profile } = await getCurrentAuthState();
  if (!user || profile?.user_type !== "crew_staff") {
    return { error: "크루 운영진만 이용할 수 있습니다.", status: 403 as const };
  }
  const supabase = createServerSupabaseClient();
  const { data: store } = await supabase
    .from("crew_stores")
    .select("id, tenant_id, crew_name, creator_user_id, store_token")
    .eq("store_token", storeToken)
    .maybeSingle();
  if (!store) return { error: "상점을 찾을 수 없습니다.", status: 404 as const };
  if (store.creator_user_id !== user.id) {
    return { error: "이 상점의 운영진이 아닙니다.", status: 403 as const };
  }
  return { user, profile, store };
}

interface Params {
  params: Promise<{ storeToken: string }>;
}

interface AttachmentMeta {
  name: string;
  url: string;
  size: number;
}

const MAX_FILES = 5;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXT = [
  ".ai", ".eps", ".pdf", ".psd",
  ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".heic", ".tif", ".tiff",
  ".zip",
];

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const supabase = createServerSupabaseClient();

    const { data: store } = await supabase
      .from("crew_stores")
      .select("id, tenant_id, crew_name")
      .eq("store_token", storeToken)
      .maybeSingle();
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }

    const form = await request.formData();
    const productId = String(form.get("productId") || "");
    const colorId = String(form.get("colorId") || "");
    const proposerName = String(form.get("proposerName") || "").trim();
    const proposerContact = String(form.get("proposerContact") || "").trim();
    const note = String(form.get("note") || "").trim();

    if (!productId || !colorId || !proposerName) {
      return NextResponse.json(
        { error: "상품·색상·제안자 이름이 필요합니다." },
        { status: 400 },
      );
    }

    let designLayers: DesignLayer[];
    try {
      designLayers = JSON.parse(String(form.get("designLayers") || "[]"));
    } catch {
      return NextResponse.json({ error: "디자인 형식 오류" }, { status: 400 });
    }
    if (!Array.isArray(designLayers) || designLayers.length === 0) {
      return NextResponse.json(
        { error: "디자인을 먼저 완성해 주세요." },
        { status: 400 },
      );
    }

    const product = await getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: "상품을 찾을 수 없습니다." }, { status: 404 });
    }
    const variant = product.variants.find((v: { id: string }) => v.id === colorId);
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

    // 제안 행 생성 (id 확보 후 첨부 업로드)
    const { data: proposal, error: insertError } = await supabase
      .from("design_proposals")
      .insert({
        tenant_id: store.tenant_id,
        store_id: store.id,
        product_id: productId,
        color_id: colorId,
        design_snapshot: designLayers as unknown as Json,
        note: note || null,
        proposer_name: proposerName.slice(0, 100),
        proposer_contact: proposerContact.slice(0, 100) || null,
        status: "pending",
      })
      .select("id")
      .single();
    if (insertError) throw new Error(insertError.message);

    const attachments: AttachmentMeta[] = [];
    for (const f of files) {
      const uploaded = await uploadReviewAttachment(f, proposal.id, f.name, true);
      if (uploaded) {
        attachments.push({ name: f.name, url: uploaded.url, size: uploaded.size });
      }
    }
    if (attachments.length > 0) {
      await supabase
        .from("design_proposals")
        .update({ attachments: attachments as unknown as Json })
        .eq("id", proposal.id);
    }

    return NextResponse.json({ success: true, data: { proposalId: proposal.id } });
  } catch (error) {
    console.error("POST /api/store/[storeToken]/proposals error:", error);
    return NextResponse.json(
      { error: "제안 접수에 실패했습니다." },
      { status: 500 },
    );
  }
}

// ── GET: 제안함 (운영진) ──
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const auth = await requireStoreOwner(storeToken);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const supabase = createServerSupabaseClient();
    const { data: rows } = await supabase
      .from("design_proposals")
      .select(
        "id, product_id, color_id, design_snapshot, attachments, note, proposer_name, proposer_contact, status, adopted_review_id, created_at",
      )
      .eq("store_id", auth.store.id)
      .order("created_at", { ascending: false });

    const proposals = rows ?? [];
    const productIds = [...new Set(proposals.map((p) => p.product_id))];
    const productMap = new Map(
      (await Promise.all(productIds.map((id) => getProductById(id))))
        .filter(Boolean)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((p: any) => [p.id, p]),
    );

    const items = proposals.map((p) => {
      const product = productMap.get(p.product_id);
      const variant = product?.variants.find(
        (v: { id: string }) => v.id === p.color_id,
      );
      const views = product
        ? Object.fromEntries(
            product.images
              .filter((img: { colorId: string }) => img.colorId === p.color_id)
              .map((img: { view: string; url: string }) => [img.view, img.url]),
          )
        : {};
      return {
        proposalId: p.id,
        productName: product?.name ?? "상품",
        proposerName: p.proposer_name,
        proposerContact: p.proposer_contact,
        note: p.note,
        status: p.status,
        adopted: !!p.adopted_review_id,
        attachments: Array.isArray(p.attachments) ? p.attachments : [],
        createdAt: p.created_at,
        designLayers: p.design_snapshot,
        designColor: variant
          ? { id: variant.id, label: variant.label, hex: variant.hex, views }
          : null,
      };
    });

    return NextResponse.json({ success: true, data: { items } });
  } catch (error) {
    console.error("GET /api/store/[storeToken]/proposals error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

// ── PUT: 채택(→제작문의) / 반려 (운영진) ──
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const auth = await requireStoreOwner(storeToken);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { user, profile, store } = auth;
    const { proposalId, action } = (await request.json()) as {
      proposalId?: string;
      action?: "adopt" | "reject";
    };
    if (!proposalId || (action !== "adopt" && action !== "reject")) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: proposal } = await supabase
      .from("design_proposals")
      .select("*")
      .eq("id", proposalId)
      .eq("store_id", store.id)
      .maybeSingle();
    if (!proposal) {
      return NextResponse.json({ error: "제안을 찾을 수 없습니다." }, { status: 404 });
    }
    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: "이미 처리된 제안입니다." },
        { status: 409 },
      );
    }

    if (action === "reject") {
      await supabase
        .from("design_proposals")
        .update({ status: "rejected", decided_at: new Date().toISOString() })
        .eq("id", proposalId);
      return NextResponse.json({ success: true });
    }

    // 채택 → 제작 문의(manufacture_reviews)로 변환, 공장 재승인
    const product = await getProductById(proposal.product_id);
    const variant = product?.variants.find(
      (v: { id: string }) => v.id === proposal.color_id,
    );
    const crewName = store.crew_name || profile?.crew_name || "우리 크루";
    const reviewToken = randomBytes(18).toString("base64url");

    const { data: review, error: reviewErr } = await supabase
      .from("manufacture_reviews")
      .insert({
        tenant_id: store.tenant_id,
        creator_user_id: user.id,
        crew_name: crewName,
        product_id: proposal.product_id,
        color_id: proposal.color_id,
        design_snapshot: proposal.design_snapshot as Json,
        attachments: (proposal.attachments ?? []) as Json,
        note: proposal.note
          ? `[크루원 제안: ${proposal.proposer_name}] ${proposal.note}`
          : `[크루원 제안: ${proposal.proposer_name}]`,
        review_token: reviewToken,
        status: "pending",
      })
      .select("id")
      .single();
    if (reviewErr) throw new Error(reviewErr.message);

    await supabase
      .from("design_proposals")
      .update({
        status: "adopted",
        adopted_review_id: review.id,
        decided_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    // 공장 채널 Discord (제작 재승인 요청)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (request.nextUrl.hostname === "localhost"
        ? request.nextUrl.origin
        : "https://runhouse-custom.vercel.app");
    notifyFactoryReviewRequest({
      crewName,
      requesterName: profile?.name,
      phone: profile?.phone,
      productName: product?.name ?? "상품",
      colorLabel: variant?.label ?? proposal.color_id,
      attachmentCount: Array.isArray(proposal.attachments)
        ? proposal.attachments.length
        : 0,
      note: proposal.note || undefined,
      reviewUrl: `${siteUrl}/review/${reviewToken}`,
    }).catch((err) => console.error("[Discord] 공장 알림 실패:", err));

    return NextResponse.json({ success: true, data: { reviewId: review.id } });
  } catch (error) {
    console.error("PUT /api/store/[storeToken]/proposals error:", error);
    return NextResponse.json({ error: "처리에 실패했습니다." }, { status: 500 });
  }
}
