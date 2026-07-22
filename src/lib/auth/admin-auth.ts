import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

export interface AdminSession {
  adminId: string
  tenantId: string
  tenantSlug: string
  username: string
}

export const ADMIN_SESSION_COOKIE = "admin_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

function getSecret(): Uint8Array {
  const raw =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.JWT_SECRET
  if (!raw) {
    throw new Error(
      "ADMIN_SESSION_SECRET (or JWT_SECRET) must be set to sign admin sessions"
    )
  }
  return new TextEncoder().encode(raw)
}

export async function createAdminSessionToken(session: AdminSession): Promise<string> {
  return await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setSubject(session.adminId)
    .sign(getSecret())
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    })
    const { adminId, tenantId, tenantSlug, username } = payload as Record<
      string,
      unknown
    >
    if (
      typeof adminId !== "string" ||
      typeof tenantId !== "string" ||
      typeof tenantSlug !== "string" ||
      typeof username !== "string"
    ) {
      return null
    }
    return { adminId, tenantId, tenantSlug, username }
  } catch {
    return null
  }
}

export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return await verifyAdminSessionToken(token)
}

export function adminSessionCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_TTL_SECONDS,
  }
}
