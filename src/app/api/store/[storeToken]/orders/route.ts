/**
 * 크루 스토어 통합 주문 API
 *
 * 구매자(크루원)가 상점의 여러 굿즈를 한 번에 주문/조회/수정/취소한다.
 * - 신원 확인: 이름 + 휴대폰 뒷 4자리 (phone_last4)
 * - 한 번의 제출 = 공통 submission_id 로 묶인 size_collection_responses 행들
 *   (굿즈·사이즈마다 1행, 기존 색상×사이즈 집계·주문 전환 로직 그대로 재사용)
 *
 * POST   { name, phoneLast4, note?, items: [{ token, sizeQuantities }] } → 주문 생성
 * GET    ?name=&phoneLast4=                                             → 내 주문 조회
 * PATCH  { name, phoneLast4, submissionId, items }                      → 주문 수정(교체)
 * DELETE ?submissionId=&name=&phoneLast4=                               → 주문 취소
 */

import { NextRequest, NextResponse } from "next/server";
import { randomBytes, randomUUID } from "crypto";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductById } from "@/application/product-service";
import { getCurrentAuthState } from "@/lib/auth/server-auth";

/** 로그인 사용자가 이 상점의 주인인지 (운영진 권한: 신원 확인·운영기간 우회) */
async function isStoreOwner(store: { creator_user_id: string }) {
  try {
    const { user } = await getCurrentAuthState();
    return !!user && user.id === store.creator_user_id;
  } catch {
    return false;
  }
}

interface Params {
  params: Promise<{ storeToken: string }>;
}

interface OrderItemInput {
  token: string; // collection token
  sizeQuantities: Record<string, number>; // { S: 1, M: 2 }
  customName?: string; // 개인화 굿즈: 유니폼에 새길 이름
}

const PHONE4_RE = /^\d{4}$/;

async function findStore(storeToken: string) {
  const supabase = createServerSupabaseClient();
  const { data: store } = await supabase
    .from("crew_stores")
    .select("*")
    .eq("store_token", storeToken)
    .maybeSingle();
  return store;
}

function storeClosedReason(store: {
  open_from: string | null;
  open_until: string | null;
}): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (store.open_from && today < store.open_from)
    return "아직 상점 운영 전입니다.";
  if (store.open_until && today > store.open_until)
    return "상점 운영이 종료되었습니다.";
  return null;
}

/** 스토어 소속 + open 상태의 collection들을 token → row 맵으로 */
async function loadOpenCollections(storeId: string) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("size_collections")
    .select("*")
    .eq("store_id", storeId);
  const map = new Map<string, NonNullable<typeof data>[number]>();
  (data || []).forEach((c) => map.set(c.token, c));
  return map;
}

/** 아이템 검증: open·기한·사이즈. 통과 시 삽입할 행들 반환 */
async function validateItems(
  collections: Map<string, { id: string; token: string; status: string; deadline: string | null; product_id: string | null; design_color_id: string | null; title: string }>,
  items: OrderItemInput[],
): Promise<
  | { ok: true; rows: Array<{ collection_id: string; color_id: string | null; size: string; quantity: number; custom_name: string | null }> }
  | { ok: false; error: string }
> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "주문할 굿즈를 선택해주세요." };
  }

  const rows: Array<{ collection_id: string; color_id: string | null; size: string; quantity: number; custom_name: string | null }> = [];

  for (const item of items) {
    const col = collections.get(item.token);
    if (!col) return { ok: false, error: "이 상점의 굿즈가 아닙니다." };
    if (col.status !== "open")
      return { ok: false, error: `'${col.title}'은(는) 마감된 굿즈입니다.` };
    if (col.deadline && new Date(col.deadline) < new Date())
      return { ok: false, error: `'${col.title}'은(는) 기한이 지났습니다.` };

    // 사이즈 검증 (확정 디자인 색상 기준)
    let validSizes: string[] | null = null;
    if (col.product_id) {
      const product = await getProductById(col.product_id);
      const variant = product?.variants.find(
        (v: { id: string }) => v.id === col.design_color_id,
      );
      if (variant) validSizes = variant.sizes;
    }

    const entries = Object.entries(item.sizeQuantities || {}).filter(
      ([, q]) => q > 0,
    );
    if (entries.length === 0)
      return { ok: false, error: `'${col.title}'의 수량을 선택해주세요.` };

    const customName =
      typeof item.customName === "string" && item.customName.trim()
        ? item.customName.trim().slice(0, 40)
        : null;

    for (const [size, qty] of entries) {
      if (!Number.isInteger(qty) || qty < 1 || qty > 20)
        return { ok: false, error: "수량은 사이즈당 1~20 사이여야 합니다." };
      if (validSizes && !validSizes.includes(size))
        return { ok: false, error: `'${col.title}'에 없는 사이즈입니다: ${size}` };
      rows.push({
        collection_id: col.id,
        color_id: col.design_color_id ?? null,
        size,
        quantity: qty,
        custom_name: customName,
      });
    }
  }

  return { ok: true, rows };
}

// ── POST: 주문 생성 ──
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const body = (await request.json()) as {
      name?: string;
      phoneLast4?: string;
      note?: string;
      items?: OrderItemInput[];
    };

    const name = body.name?.trim();
    const phoneLast4 = body.phoneLast4?.trim();
    if (!name || !phoneLast4 || !PHONE4_RE.test(phoneLast4)) {
      return NextResponse.json(
        { error: "이름과 휴대폰 뒷 4자리를 입력해주세요." },
        { status: 400 },
      );
    }

    const store = await findStore(storeToken);
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }
    const owner = await isStoreOwner(store);
    const closed = storeClosedReason(store);
    if (closed && !owner) {
      // 운영진은 운영기간 밖에도 현장 접수분을 직접 추가할 수 있다
      return NextResponse.json({ error: closed }, { status: 400 });
    }

    const collections = await loadOpenCollections(store.id);
    const validated = await validateItems(collections, body.items || []);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const submissionId = randomUUID();
    const editToken = randomBytes(12).toString("base64url");
    const note = body.note?.trim().slice(0, 500) || null;

    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from("size_collection_responses").insert(
      validated.rows.map((r) => ({
        ...r,
        name: name.slice(0, 100),
        phone_last4: phoneLast4,
        submission_id: submissionId,
        edit_token: editToken,
        note,
      })),
    );
    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      data: { submissionId, editToken },
    });
  } catch (error) {
    console.error("POST /api/store/[storeToken]/orders error:", error);
    return NextResponse.json({ error: "주문에 실패했습니다." }, { status: 500 });
  }
}

// ── GET: 내 주문 조회 (이름 + 뒷 4자리) ──
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.trim();
    const phoneLast4 = searchParams.get("phoneLast4")?.trim();
    if (!name || !phoneLast4 || !PHONE4_RE.test(phoneLast4)) {
      return NextResponse.json(
        { error: "이름과 휴대폰 뒷 4자리를 입력해주세요." },
        { status: 400 },
      );
    }

    const store = await findStore(storeToken);
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }

    const supabase = createServerSupabaseClient();
    const { data: collections } = await supabase
      .from("size_collections")
      .select("id, token, title, status, unit_price")
      .eq("store_id", store.id);
    const colById = new Map((collections || []).map((c) => [c.id, c]));
    const colIds = (collections || []).map((c) => c.id);
    if (colIds.length === 0) {
      return NextResponse.json({ success: true, data: { submissions: [] } });
    }

    const { data: responses, error } = await supabase
      .from("size_collection_responses")
      .select("*")
      .in("collection_id", colIds)
      .eq("name", name)
      .eq("phone_last4", phoneLast4)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // submission_id 별 그룹핑 (없으면 개별 행을 단독 그룹으로)
    const groups = new Map<string, typeof responses>();
    (responses || []).forEach((r) => {
      const key = r.submission_id ?? r.id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });

    const submissions = [...groups.entries()].map(([submissionId, rows]) => {
      const items = rows!.map((r) => {
        const col = colById.get(r.collection_id);
        return {
          responseId: r.id,
          collectionToken: col?.token,
          title: col?.title ?? "알 수 없는 굿즈",
          collectionStatus: col?.status,
          unitPrice: col?.unit_price ?? 0,
          size: r.size,
          quantity: r.quantity,
        };
      });
      const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      // 소속 굿즈가 하나라도 주문 전환되면 수정 불가
      const locked = items.some((i) => i.collectionStatus === "ordered");
      return {
        submissionId,
        createdAt: rows![0].created_at,
        note: rows![0].note,
        items,
        total,
        locked,
      };
    });

    return NextResponse.json({ success: true, data: { submissions } });
  } catch (error) {
    console.error("GET /api/store/[storeToken]/orders error:", error);
    return NextResponse.json({ error: "조회에 실패했습니다." }, { status: 500 });
  }
}

// ── PATCH: 주문 수정 (해당 submission의 행 교체) ──
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const body = (await request.json()) as {
      name?: string;
      phoneLast4?: string;
      submissionId?: string;
      note?: string;
      items?: OrderItemInput[];
    };

    const name = body.name?.trim();
    const phoneLast4 = body.phoneLast4?.trim();
    if (!name || !phoneLast4 || !PHONE4_RE.test(phoneLast4) || !body.submissionId) {
      return NextResponse.json({ error: "요청이 올바르지 않습니다." }, { status: 400 });
    }

    const store = await findStore(storeToken);
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }

    const supabase = createServerSupabaseClient();
    const owner = await isStoreOwner(store);

    // 본인 제출 확인 (이름+뒷4자리+submission) — 운영진은 submission만으로 접근
    let existingQuery = supabase
      .from("size_collection_responses")
      .select("id, collection_id, edit_token")
      .eq("submission_id", body.submissionId);
    if (!owner) {
      existingQuery = existingQuery.eq("name", name).eq("phone_last4", phoneLast4);
    }
    const { data: existing } = await existingQuery;
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    // 전환된 굿즈 포함 여부 확인
    const colIds = [...new Set(existing.map((r) => r.collection_id))];
    const { data: cols } = await supabase
      .from("size_collections")
      .select("id, status")
      .in("id", colIds);
    if ((cols || []).some((c) => c.status === "ordered")) {
      return NextResponse.json(
        { error: "이미 주문 전환되어 수정할 수 없습니다. 운영진에게 문의하세요." },
        { status: 400 },
      );
    }

    const collections = await loadOpenCollections(store.id);
    const validated = await validateItems(collections, body.items || []);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    // 기존 행 삭제 후 재삽입 (submission 교체)
    const editToken = existing[0].edit_token;
    const { error: delError } = await supabase
      .from("size_collection_responses")
      .delete()
      .eq("submission_id", body.submissionId);
    if (delError) throw new Error(delError.message);

    const note = body.note?.trim().slice(0, 500) || null;
    const { error: insError } = await supabase
      .from("size_collection_responses")
      .insert(
        validated.rows.map((r) => ({
          ...r,
          name: name.slice(0, 100),
          phone_last4: phoneLast4,
          submission_id: body.submissionId,
          edit_token: editToken,
          note,
        })),
      );
    if (insError) throw new Error(insError.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/store/[storeToken]/orders error:", error);
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
}

// ── DELETE: 주문 취소 ──
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { storeToken } = await params;
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name")?.trim();
    const phoneLast4 = searchParams.get("phoneLast4")?.trim();
    const submissionId = searchParams.get("submissionId");
    if (!submissionId) {
      return NextResponse.json({ error: "요청이 올바르지 않습니다." }, { status: 400 });
    }

    const store = await findStore(storeToken);
    if (!store) {
      return NextResponse.json({ error: "상점을 찾을 수 없습니다." }, { status: 404 });
    }

    const owner = await isStoreOwner(store);
    if (!owner && (!name || !phoneLast4 || !PHONE4_RE.test(phoneLast4))) {
      return NextResponse.json({ error: "요청이 올바르지 않습니다." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    let existingQuery = supabase
      .from("size_collection_responses")
      .select("id, collection_id")
      .eq("submission_id", submissionId);
    if (!owner) {
      existingQuery = existingQuery.eq("name", name!).eq("phone_last4", phoneLast4!);
    }
    const { data: existing } = await existingQuery;
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    const colIds = [...new Set(existing.map((r) => r.collection_id))];
    const { data: cols } = await supabase
      .from("size_collections")
      .select("id, status")
      .in("id", colIds);
    if ((cols || []).some((c) => c.status === "ordered")) {
      return NextResponse.json(
        { error: "이미 주문 전환되어 취소할 수 없습니다. 운영진에게 문의하세요." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("size_collection_responses")
      .delete()
      .eq("submission_id", submissionId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/store/[storeToken]/orders error:", error);
    return NextResponse.json({ error: "취소에 실패했습니다." }, { status: 500 });
  }
}
