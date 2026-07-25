import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin-auth";
import { AdminCrewApprovalsClient } from "@/components/admin/AdminCrewApprovalsClient";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

export default async function CrewApprovalsPage({ params }: Props) {
  const { tenantSlug } = await params;

  const session = await getCurrentAdmin();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.tenantSlug !== tenantSlug) {
    redirect(`/admin/${session.tenantSlug}/crew-approvals`);
  }

  return <AdminCrewApprovalsClient tenantSlug={tenantSlug} />;
}
