import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";

interface AdminDashboardPageProps {
  params: Promise<{ tenantSlug: string }>;
}

export default async function AdminDashboard({
  params,
}: AdminDashboardPageProps) {
  const { tenantSlug } = await params;

  const session = await getCurrentAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.tenantSlug !== tenantSlug) {
    redirect(`/admin/${session.tenantSlug}/dashboard`);
  }

  return <AdminDashboardClient tenantSlugParam={tenantSlug} />;
}
