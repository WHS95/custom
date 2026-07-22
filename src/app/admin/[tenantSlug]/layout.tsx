import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/auth/admin-auth"

interface AdminTenantLayoutProps {
  children: React.ReactNode
  params: Promise<{ tenantSlug: string }>
}

export default async function AdminTenantLayout({
  children,
  params,
}: AdminTenantLayoutProps) {
  const { tenantSlug } = await params

  const session = await getCurrentAdmin()
  if (!session) {
    redirect("/admin/login")
  }

  if (session.tenantSlug !== tenantSlug) {
    redirect(`/admin/${session.tenantSlug}/dashboard`)
  }

  return <>{children}</>
}
