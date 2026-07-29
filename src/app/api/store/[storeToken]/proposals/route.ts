/**
 * 크루원 디자인 제안 API (공개 — 비로그인 크루원)
 *
 * POST /api/store/[storeToken]/proposals
 *   multipart/form-data: productId, colorId, designLayers(JSON), proposerName,
 *                        proposerContact?, note?, files[]
 *   → design_proposals(pending) 생성. 운영진이 상점 관리 '제안함'에서 채택/반려.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import { uploadReviewAttachment } from "@/infrastructure/supabase/storage";
import type { Json } from "@/infrastructure/supabase/database.types";
import type { DesignLayer } from "@/components/shared/HatDesignCanvas";

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
