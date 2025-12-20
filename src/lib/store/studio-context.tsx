"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

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

interface StudioConfig {
  basePrice: number
  colors: ProductColor[]
  safeZones: Record<HatView, Zone>
}

interface StudioConfigContextType {
  config: StudioConfig
  updateConfig: (newConfig: StudioConfig) => void
  resetConfig: () => void
}

const DEFAULT_CONFIG: StudioConfig = {
  basePrice: 22400,
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
  //디자인 로고를 두는 안전 영역
  safeZones: {
      front: { x: 30, y: 30, width: 40, height: 30 },
      left: { x: 30, y: 40, width: 40, height: 20 },
      right: { x: 30, y: 40, width: 40, height: 20 },
      back: { x: 30, y: 40, width: 40, height: 20 },
      top: { x: 25, y: 25, width: 50, height: 50 },
  }
}

const StudioConfigContext = createContext<StudioConfigContextType | undefined>(undefined)

export function StudioConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StudioConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("runhouse_studio_config")
    if (saved) {
        try {
            const parsed = JSON.parse(saved) as StudioConfig
            
            // Merge with defaults to ensure all keys exist (Deep Merge for SafeZones & Views)
            const mergedConfig: StudioConfig = {
                ...DEFAULT_CONFIG,
                ...parsed,
                colors: DEFAULT_CONFIG.colors.map(defaultColor => {
                    const savedColor = parsed.colors?.find(c => c.id === defaultColor.id)
                    if (!savedColor) return defaultColor
                    return {
                        ...defaultColor,
                        ...savedColor,
                        views: { ...defaultColor.views, ...savedColor.views }
                    }
                }),
                safeZones: {
                    ...DEFAULT_CONFIG.safeZones,
                    ...(parsed.safeZones || {})
                }
            }

            setConfig(mergedConfig)
        } catch (e) {
            console.error("Failed to parse saved config", e)
        }
    }
    setIsLoaded(true)
  }, [])

  // Save to LocalStorage on change
  useEffect(() => {
      if (isLoaded) {
          localStorage.setItem("runhouse_studio_config", JSON.stringify(config))
      }
  }, [config, isLoaded])

  const updateConfig = (newConfig: StudioConfig) => {
      setConfig(newConfig)
  }

  const resetConfig = () => {
      setConfig(DEFAULT_CONFIG)
  }

  // Avoid hydration mismatch by rendering children only after load (or just rendering default first)
  // For this app, rendering default first then snapping to saved is fine, or showing a loader.
  // I will just return children to avoid layout shift issues, state updates will trigger re-render.
  return (
    <StudioConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
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
