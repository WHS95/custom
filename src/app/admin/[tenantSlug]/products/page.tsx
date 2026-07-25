import { redirect } from "next/navigation";
import { getProductsByTenant } from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";
import { AdminProductsPageClient } from "@/components/admin/AdminProductsPageClient";

interface AdminProductsPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function AdminProductsPage({
  params,
}: AdminProductsPageProps) {
  const { tenantSlug } = await params;

  const session = await getCurrentAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.tenantSlug !== tenantSlug) {
    redirect(`/admin/${session.tenantSlug}/products`);
  }

  const initialProducts = await getProductsByTenant(DEFAULT_TENANT_ID, true);

  return (
    <AdminProductsPageClient
      tenantSlugParam={tenantSlug}
      initialProducts={initialProducts}
    />
  );
}
