import { NextResponse } from "next/server"
import { getCurrentAdmin } from "@/lib/auth/admin-auth"

export async function GET() {
  const session = await getCurrentAdmin()
  if (!session) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
  return NextResponse.json({
    authenticated: true,
    adminId: session.adminId,
    tenantId: session.tenantId,
    tenantSlug: session.tenantSlug,
    username: session.username,
  })
}
