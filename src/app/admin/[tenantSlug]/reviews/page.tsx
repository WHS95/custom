import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import type { Review } from "@/domain/review/types";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { AdminReviewsPageClient } from "@/components/admin/AdminReviewsPageClient";

interface AdminReviewsPageProps {
  params: Promise<{ tenantSlug: string }>;
}

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

export default async function AdminReviewsPage({
  params,
}: AdminReviewsPageProps) {
  const { tenantSlug } = await params;

  const session = await getCurrentAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.tenantSlug !== tenantSlug) {
    redirect(`/admin/${session.tenantSlug}/reviews`);
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await (supabase as any)
    .schema("runhousecustom")
    .from("reviews")
    .select("*")
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Initial reviews fetch error:", error);
  }

  return (
    <AdminReviewsPageClient
      tenantSlugParam={tenantSlug}
      initialReviews={(data || []).map(toReview)}
    />
  );
}
