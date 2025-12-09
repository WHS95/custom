"use client"

import React, { useState } from "react"
import { HatCanvas, Layer } from "./HatCanvas"
import { ProductSidebar } from "./ProductSidebar"
import { DesignToolbar } from "./DesignToolbar"
import { toast } from "sonner"
import { HatView } from "@/lib/store/studio-context"

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);
export function StudioLayout() {
  const [selectedColor, setSelectedColor] = useState("black")
  const [currentView, setCurrentView] = useState<HatView>("front")
  const [layers, setLayers] = useState<Layer[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const newLayer: Layer = {
        id: generateId(),
        type: "image",
        content: ev.target?.result as string,
        x: 350,
        y: 300,
        width: 150,
        height: 150,
        view: currentView
      }
      setLayers(prev => [...prev, newLayer])
      toast.success("Image layer added")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveLayer = (id: string) => {
      setLayers(prev => prev.filter(l => l.id !== id))
      toast.info("Layer removed")
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50">
       
       {/* Main Canvas Area */}
       <div className="flex-1 relative">
            <HatCanvas 
                hatColor={selectedColor} 
                currentView={currentView}
                onViewChange={setCurrentView}
                layers={layers}
                onRemoveLayer={handleRemoveLayer}
            />
            
            {/* Floating Tool Bar */}
            <DesignToolbar 
                onUploadClick={() => document.getElementById('hidden-file-input')?.click()} 
            />
            
            {/* Hidden Input for Toolbar Action */}
            <input 
                id="hidden-file-input"
                type="file" 
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
            />
       </div>

       {/* Right Sidebar: Product & Commerce */}
       <ProductSidebar 
            selectedColor={selectedColor} 
            onColorChange={setSelectedColor}
       />
    </div>
  )
}
