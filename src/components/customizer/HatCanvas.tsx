"use client"

import React, { useRef, useState } from "react"
import Image from "next/image"
import { Rnd } from "react-rnd"
import { X } from "lucide-react"

interface HatCanvasProps {
  hatColor: "black" | "khaki" | "beige" | "red"
  logoImage: string | null
  onRemoveLogo: () => void
}

export function HatCanvas({ hatColor, logoImage, onRemoveLogo }: HatCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-square max-w-[500px] mx-auto bg-gray-50 rounded-lg overflow-hidden border border-border shadow-sm"
    >
      {/* Base Hat Image */}
      <Image
        src={`/assets/hats/${hatColor}.png`}
        alt={`${hatColor} hat`}
        fill
        className="object-contain pointer-events-none select-none"
        priority
      />

      {/* Helper Grid / Safe Zone (Optional overlay) */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-transparent flex items-center justify-center">
         {/* Could add a dotted box here to show print area */}
         <div className="w-[40%] h-[30%] border-2 border-dashed border-primary/50 relative -top-10" />
      </div>

      {/* Draggable Logo */}
      {logoImage && (
        <Rnd
          default={{
            x: 150,
            y: 150,
            width: 100,
            height: 100,
          }}
          bounds="parent"
          className="z-10 group border border-transparent hover:border-primary/50 transition-colors"
          lockAspectRatio
        >
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-full h-full object-contain pointer-events-none" 
            />
            <button 
              onClick={onRemoveLogo}
              className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              type="button"
            >
              <X size={12} />
            </button>
          </div>
        </Rnd>
      )}
    </div>
  )
}
