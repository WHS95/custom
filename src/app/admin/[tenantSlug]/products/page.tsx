import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getProductsByTenant } from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import { AdminProductsPageClient } from "@/components/admin/AdminProductsPageClient";

interface AdminProductsPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function AdminProductsPage({
  params,
}: AdminProductsPageProps) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth")?.value;
  const tenantSlugCookie = cookieStore.get("tenant_slug")?.value;

  if (adminAuth !== "true") {
    redirect("/admin/login");
  }

  if (tenantSlugCookie && tenantSlugCookie !== tenantSlug) {
    redirect(`/admin/${tenantSlugCookie}/products`);
  }

  const initialProducts = await getProductsByTenant(DEFAULT_TENANT_ID, true);

  return (
    <AdminProductsPageClient
      tenantSlugParam={tenantSlug}
      initialProducts={initialProducts}
    />
  );
}
