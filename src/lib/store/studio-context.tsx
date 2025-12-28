"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"

export type HatView = "front" | "left" | "right" | "back" | "top"

export interface Zone {
  x: number // %
  y: number // %
  width: number // %
  height: number // %
}

export interface ProductColor {
  id: string
  label: string
  hex: string
  views: Record<HatView, string> // url or base64
}

export interface StudioConfig {
  basePrice: number
  shippingFreeThreshold: number
  shippingCost: number
  currency: string
  colors: ProductColor[]
  safeZones: Record<HatView, Zone>
}

interface StudioConfigContextType {
  config: StudioConfig
  isLoading: boolean
  isSaving: boolean
  error: string | null
  updateConfig: (newConfig: Partial<StudioConfig>) => Promise<void>
  resetConfig: () => Promise<void>
  refreshConfig: () => Promise<void>
}

const DEFAULT_CONFIG: StudioConfig = {
  basePrice: 22400,
  shippingFreeThreshold: 50000,
  shippingCost: 3000,
  currency: "KRW",
  colors: [
    {
      id: "black",
      label: "Midnight Black",
      hex: "#000000",
      views: {
        front: "/assets/hats/black-front.png",
        left: "/assets/hats/black-left.png",
        right: "/assets/hats/black-right.png",
        back: "/assets/hats/black-back.png",
        top: "/assets/hats/black-top.png"
      }
    },
    {
      id: "khaki",
      label: "Desert Khaki",
      hex: "#C3B091",
      views: {
        front: "/assets/hats/khaki.png",
        left: "/assets/hats/khaki-side.png",
        right: "/assets/hats/khaki-side.png",
        back: "/assets/hats/khaki-back.png",
        top: "/assets/hats/khaki-top.png"
      }
    },
    {
      id: "beige",
      label: "Sand Beige",
      hex: "#F5F5DC",
      views: {
        front: "/assets/hats/beige.png",
        left: "/assets/hats/beige-side.png",
        right: "/assets/hats/beige-side.png",
        back: "/assets/hats/beige-back.png",
        top: "/assets/hats/beige-top.png"
      }
    },
    {
      id: "red",
      label: "Race Red",
      hex: "#FF0000",
      views: {
        front: "/assets/hats/red.png",
        left: "/assets/hats/red-side.png",
        right: "/assets/hats/red-side.png",
        back: "/assets/hats/red-back.png",
        top: "/assets/hats/red-top.png"
      }
    },
  ],
  safeZones: {
    front: { x: 30, y: 30, width: 40, height: 30 },
    left: { x: 30, y: 40, width: 40, height: 20 },
    right: { x: 30, y: 40, width: 40, height: 20 },
    back: { x: 30, y: 40, width: 40, height: 20 },
    top: { x: 25, y: 25, width: 50, height: 50 },
  }
}

const STORAGE_KEY = "runhouse_studio_config_cache"

const StudioConfigContext = createContext<StudioConfigContextType | undefined>(undefined)

export function StudioConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_CONFIG)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * API에서 테넌트 설정 가져오기
   */
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/tenant')
      if (!response.ok) {
        throw new Error('Failed to fetch tenant settings')
      }
      const result = await response.json()
      if (result.success && result.data?.settings) {
        const settings = result.data.settings
        const newConfig: StudioConfig = {
          basePrice: settings.basePrice ?? DEFAULT_CONFIG.basePrice,
          shippingFreeThreshold: settings.shippingFreeThreshold ?? DEFAULT_CONFIG.shippingFreeThreshold,
          shippingCost: settings.shippingCost ?? DEFAULT_CONFIG.shippingCost,
          currency: settings.currency ?? DEFAULT_CONFIG.currency,
          colors: settings.colors ?? DEFAULT_CONFIG.colors,
          safeZones: settings.safeZones ?? DEFAULT_CONFIG.safeZones,
        }
        setConfig(newConfig)
        // 로컬 캐시 업데이트
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))
        setError(null)
        return newConfig
      }
    } catch (err) {
      console.error('Failed to fetch config from API:', err)
      setError('설정을 불러오는데 실패했습니다')
      // API 실패시 로컬 캐시 사용
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as StudioConfig
          setConfig(mergeWithDefaults(parsed))
        } catch (e) {
          console.error('Failed to parse cached config:', e)
        }
      }
    }
    return null
  }, [])

  // 초기 로드
  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      // 먼저 로컬 캐시로 빠르게 렌더링
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as StudioConfig
          setConfig(mergeWithDefaults(parsed))
        } catch (e) {
          console.error('Failed to parse cached config:', e)
        }
      }
      // API에서 최신 설정 가져오기
      await fetchConfig()
      setIsLoading(false)
    }
    init()
  }, [fetchConfig])

  /**
   * 설정 업데이트 (API에 저장)
   */
  const updateConfig = useCallback(async (updates: Partial<StudioConfig>) => {
    setIsSaving(true)
    setError(null)

    const newConfig = { ...config, ...updates }

    // 낙관적 업데이트
    setConfig(newConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig))

    try {
      const response = await fetch('/api/tenant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newConfig }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      const result = await response.json()
      if (result.success && result.data?.settings) {
        // 서버 응답으로 동기화
        const serverConfig: StudioConfig = {
          basePrice: result.data.settings.basePrice,
          shippingFreeThreshold: result.data.settings.shippingFreeThreshold,
          shippingCost: result.data.settings.shippingCost,
          currency: result.data.settings.currency,
          colors: result.data.settings.colors,
          safeZones: result.data.settings.safeZones,
        }
        setConfig(serverConfig)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverConfig))
      }
    } catch (err) {
      console.error('Failed to save config:', err)
      setError('설정 저장에 실패했습니다')
      // 실패시 이전 상태로 롤백하지 않음 (로컬은 유지)
    } finally {
      setIsSaving(false)
    }
  }, [config])

  /**
   * 기본값으로 리셋
   */
  const resetConfig = useCallback(async () => {
    await updateConfig(DEFAULT_CONFIG)
  }, [updateConfig])

  /**
   * 서버에서 설정 다시 가져오기
   */
  const refreshConfig = useCallback(async () => {
    setIsLoading(true)
    await fetchConfig()
    setIsLoading(false)
  }, [fetchConfig])

  return (
    <StudioConfigContext.Provider value={{
      config,
      isLoading,
      isSaving,
      error,
      updateConfig,
      resetConfig,
      refreshConfig,
    }}>
      {children}
    </StudioConfigContext.Provider>
  )
}

export function useStudioConfig() {
  const context = useContext(StudioConfigContext)
  if (!context) {
    throw new Error("useStudioConfig must be used within a StudioConfigProvider")
  }
  return context
}

/**
 * 기본값과 병합 (누락된 필드 보완)
 */
function mergeWithDefaults(parsed: Partial<StudioConfig>): StudioConfig {
  return {
    basePrice: parsed.basePrice ?? DEFAULT_CONFIG.basePrice,
    shippingFreeThreshold: parsed.shippingFreeThreshold ?? DEFAULT_CONFIG.shippingFreeThreshold,
    shippingCost: parsed.shippingCost ?? DEFAULT_CONFIG.shippingCost,
    currency: parsed.currency ?? DEFAULT_CONFIG.currency,
    colors: parsed.colors?.length ? parsed.colors.map((c, i) => ({
      ...DEFAULT_CONFIG.colors[i],
      ...c,
      views: { ...(DEFAULT_CONFIG.colors[i]?.views || {}), ...(c.views || {}) }
    })) : DEFAULT_CONFIG.colors,
    safeZones: {
      ...DEFAULT_CONFIG.safeZones,
      ...(parsed.safeZones || {})
    }
  }
}
