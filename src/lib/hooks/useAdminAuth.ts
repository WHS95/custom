"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AdminAuth {
  isAuthenticated: boolean
  isLoading: boolean
  adminId: string | null
  tenantId: string | null
  tenantSlug: string | null
  logout: () => Promise<void>
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || null
  return null
}

export function useAdminAuth(): AdminAuth {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [auth, setAuth] = useState<{
    isAuthenticated: boolean
    adminId: string | null
    tenantId: string | null
    tenantSlug: string | null
  }>({
    isAuthenticated: false,
    adminId: null,
    tenantId: null,
    tenantSlug: null,
  })

  useEffect(() => {
    const adminAuth = getCookie("admin_auth")
    const adminId = getCookie("admin_id")
    const tenantId = getCookie("tenant_id")
    const tenantSlug = getCookie("tenant_slug")

    if (adminAuth === "true" && tenantId) {
      setAuth({
        isAuthenticated: true,
        adminId,
        tenantId,
        tenantSlug,
      })
    } else {
      setAuth({
        isAuthenticated: false,
        adminId: null,
        tenantId: null,
        tenantSlug: null,
      })
    }

    setIsLoading(false)
  }, [])

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } catch (error) {
      console.error("Logout error:", error)
    }
    router.push("/admin/login")
  }

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading,
    adminId: auth.adminId,
    tenantId: auth.tenantId,
    tenantSlug: auth.tenantSlug,
    logout,
  }
}
