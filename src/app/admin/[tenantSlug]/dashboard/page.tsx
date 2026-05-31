import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

interface AdminDashboardPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function AdminDashboard({
  params,
}: AdminDashboardPageProps) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth")?.value;
  const tenantSlugCookie = cookieStore.get("tenant_slug")?.value;

  if (adminAuth !== "true") {
    redirect("/admin/login");
  }

  if (tenantSlugCookie && tenantSlugCookie !== tenantSlug) {
    redirect(`/admin/${tenantSlugCookie}/dashboard`);
  }

  return <AdminDashboardClient tenantSlugParam={tenantSlug} />;
}
