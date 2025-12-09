"use client"

import React, { useState } from "react"
import { HatCanvas } from "./HatCanvas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, ShoppingBag, Download, Check } from "lucide-react"
import { toast } from "sonner"

const HAT_COLORS = [
  { id: "black", label: "Midnight Black", hex: "#000000" },
  { id: "khaki", label: "Desert Khaki", hex: "#C3B091" },
  { id: "beige", label: "Sand Beige", hex: "#F5F5DC" },
  { id: "red", label: "Race Red", hex: "#FF0000" },
] as const

export function HatCustomizer() {
  const [selectedColor, setSelectedColor] = useState<typeof HAT_COLORS[number]["id"]>("black")
  const [logoBase64, setLogoBase64] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setLogoBase64(ev.target?.result as string)
      toast.success("Logo uploaded successfully!")
    }
    reader.readAsDataURL(file)
  }

  const handleSaveDesign = () => {
    // In a real app, we would capture the Rnd state here.
    toast.success("Design saved to Crew Locker!")
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
      {/* Left Interface: Canvas */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-black p-8 rounded-xl shadow-sm border">
            <HatCanvas 
                hatColor={selectedColor} 
                logoImage={logoBase64}
                onRemoveLogo={() => setLogoBase64(null)}
            />
        </div>
        <div className="flex justify-center gap-4">
            <p className="text-sm text-muted-foreground text-center animate-pulse">
                💡 Tip: Drag and resize your logo to fit within the dashed zone.
            </p>
        </div>
      </div>

      {/* Right Interface: Controls */}
      <div className="space-y-6">
        <Card className="border-none shadow-lg">
            <CardHeader>
                <CardTitle>Custom Lab</CardTitle>
                <CardDescription>Design your crew's official gear.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {/* Color Selector */}
                <div className="space-y-3">
                    <Label>1. Select Base Color</Label>
                    <div className="flex gap-3">
                        {HAT_COLORS.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedColor(c.id)}
                                className={`w-10 h-10 rounded-full border-2 transition-all ${
                                    selectedColor === c.id 
                                    ? "border-black scale-110 ring-2 ring-offset-2 ring-black/10" 
                                    : "border-transparent opacity-80 hover:opacity-100 hover:scale-105"
                                }`}
                                style={{ backgroundColor: c.hex }}
                                title={c.label}
                            />
                        ))}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{HAT_COLORS.find(c => c.id === selectedColor)?.label}</p>
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                    <Label>2. Upload Crew Logo</Label>
                    <div className="relative group">
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center group-hover:border-primary transition-colors bg-gray-50 group-hover:bg-gray-100">
                             <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mb-2">
                                <Upload className="w-5 h-5 text-gray-600" />
                             </div>
                             <p className="text-sm font-medium text-gray-700">Click to upload PNG/JPG</p>
                             <p className="text-xs text-gray-400 mt-1">Make sure background is transparent</p>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="w-full" onClick={handleSaveDesign}>
                        <Download className="mr-2 h-4 w-4" /> Save Draft
                    </Button>
                    <Button className="w-full bg-black hover:bg-gray-800 text-white shadow-xl hover:shadow-2xl transition-all">
                        <ShoppingBag className="mr-2 h-4 w-4" /> Order Sample
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Status Preview (Mini Dashboard) */}
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Production Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 p-2 rounded">
                    <Check className="h-4 w-4" /> Factory Ready: 22,400 KRW
                </div>
                <div className="mt-2 text-xs text-gray-500">
                    Est. Delivery: 2-3 Weeks after order
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
