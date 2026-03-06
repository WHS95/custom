import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { Review } from "@/domain/review/types";
import { GalleryClient } from "@/components/gallery/GalleryClient";

export const metadata: Metadata = {
  title: "고객 후기 | RunHouse Custom",
  description: "RunHouse Custom 고객분들의 생생한 커스텀 모자 후기를 확인하세요.",
  openGraph: {
    title: "고객 후기 | RunHouse Custom",
    description: "실제 고객분들의 커스텀 모자 후기와 사진을 확인하세요.",
  },
};

function toReview(row: any): Review {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    orderId: row.order_id,
    authorType: row.author_type,
    authorName: row.author_name,
    organizationName: row.organization_name,
    title: row.title,
    content: row.content,
    rating: row.rating,
    images: row.images || [],
    status: row.status,
    adminMemo: row.admin_memo,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    approvedAt: row.approved_at,
  };
}

async function getPublicReviews() {
  const supabase = createServerSupabaseClient();

  const baseQuery = (supabase as any)
    .schema("runhousecustom")
    .from("reviews")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const [allResult, featuredResult] = await Promise.all([
    baseQuery.limit(50),
    (supabase as any)
      .schema("runhousecustom")
      .from("reviews")
      .select("*")
      .eq("tenant_id", DEFAULT_TENANT_ID)
      .eq("status", "approved")
      .eq("is_featured", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (allResult.error || featuredResult.error) {
    console.error(
      "Failed to fetch reviews:",
      allResult.error || featuredResult.error,
    );
    return { reviews: [] as Review[], featuredReviews: [] as Review[] };
  }

  return {
    reviews: (allResult.data || []).map(toReview),
    featuredReviews: (featuredResult.data || []).map(toReview),
  };
}

export default async function GalleryPage() {
  const { reviews, featuredReviews } = await getPublicReviews();

  return <GalleryClient reviews={reviews} featuredReviews={featuredReviews} />;
}
