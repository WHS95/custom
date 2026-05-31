import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminCrewApprovalsClient } from "@/components/admin/AdminCrewApprovalsClient";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function CrewApprovalsPage({ params }: Props) {
  const { tenantSlug } = await params;

  const cookieStore = await cookies();
  const adminAuth = cookieStore.get("admin_auth")?.value;
  const tenantSlugCookie = cookieStore.get("tenant_slug")?.value;

  if (adminAuth !== "true") {
    redirect("/admin/login");
  }

  if (tenantSlugCookie && tenantSlugCookie !== tenantSlug) {
    redirect(`/admin/${tenantSlugCookie}/crew-approvals`);
  }

  return <AdminCrewApprovalsClient tenantSlug={tenantSlug} />;
}
