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

interface MeResponse {
  authenticated: boolean
  adminId?: string
  tenantId?: string
  tenantSlug?: string
  username?: string
}

interface State {
  isLoading: boolean
  isAuthenticated: boolean
  adminId: string | null
  tenantId: string | null
  tenantSlug: string | null
}

const INITIAL_STATE: State = {
  isLoading: true,
  isAuthenticated: false,
  adminId: null,
  tenantId: null,
  tenantSlug: null,
}

export function useAdminAuth(): AdminAuth {
  const router = useRouter()
  const [state, setState] = useState<State>(INITIAL_STATE)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" })
        const data = (await res.json()) as MeResponse
        if (cancelled) return
        if (res.ok && data.authenticated) {
          setState({
            isLoading: false,
            isAuthenticated: true,
            adminId: data.adminId ?? null,
            tenantId: data.tenantId ?? null,
            tenantSlug: data.tenantSlug ?? null,
          })
        } else {
          setState({
            isLoading: false,
            isAuthenticated: false,
            adminId: null,
            tenantId: null,
            tenantSlug: null,
          })
        }
      } catch (error) {
        console.error("admin auth check failed:", error)
        if (cancelled) return
        setState({
          isLoading: false,
          isAuthenticated: false,
          adminId: null,
          tenantId: null,
          tenantSlug: null,
        })
      }
    })()
    return () => {
      cancelled = true
    }
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
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    adminId: state.adminId,
    tenantId: state.tenantId,
    tenantSlug: state.tenantSlug,
    logout,
  }
}
